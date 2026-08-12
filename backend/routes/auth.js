const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

const profileUploadDir = path.join(
  __dirname,
  '..',
  'uploads',
  'profiles'
);

if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, {
    recursive: true
  });
}

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const safeName =
      `profile-${req.user.id}-${Date.now()}${extension}`;

    cb(null, safeName);
  }
});

const profileFileFilter = (
  req,
  file,
  cb
) => {
  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
  ]);

  if (
    !allowedMimeTypes.has(file.mimetype)
  ) {
    return cb(
      new Error(
        'Only JPG, PNG and WEBP images are allowed.'
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadProfilePicture = (
  req,
  res,
  next
) => {
  upload.single('profile_picture')(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      if (
        error instanceof multer.MulterError
      ) {
        if (
          error.code === 'LIMIT_FILE_SIZE'
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Profile picture must be 5 MB or smaller.'
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          'Invalid profile picture.'
      });
    }
  );
};

const JWT_SECRET =
  process.env.JWT_SECRET;

const JWT_EXPIRE =
  process.env.JWT_EXPIRE || '1d';

const SALT_ROUNDS = Number(
  process.env.BCRYPT_SALT_ROUNDS || 12
);

const VALID_ROLES = new Set([
  'client',
  'freelancer'
]);

const normalizeEmail = (
  email = ''
) =>
  email.trim().toLowerCase();

const publicUser = (user) => ({
  id: user.user_id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  profile_picture:
    user.profile_picture || null
});

// REGISTER
router.post(
  '/register',
  (req, res) => {
    const fullName = String(
      req.body.full_name || ''
    ).trim();

    const email =
      normalizeEmail(req.body.email);

    const password = String(
      req.body.password || ''
    );

    const role = String(
      req.body.role || ''
    );

    if (
      !fullName ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          'All fields are required.'
      });
    }

    if (
      !/^\S+@\S+\.\S+$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Enter a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters.'
      });
    }

    if (!VALID_ROLES.has(role)) {
      return res.status(400).json({
        success: false,
        message:
          'Choose either Client or Freelancer.'
      });
    }

    db.query(
      `
        SELECT user_id
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email],
      async (
        selectError,
        rows
      ) => {
        if (selectError) {
          console.error(
            'Registration Email Check Error:',
            selectError
          );

          return res.status(500).json({
            success: false,
            message:
              'Database error.'
          });
        }

        if (rows.length > 0) {
          return res.status(409).json({
            success: false,
            message:
              'An account already exists with this email.'
          });
        }

        try {
          const passwordHash =
            await bcrypt.hash(
              password,
              SALT_ROUNDS
            );

          db.query(
            `
              INSERT INTO users (
                full_name,
                email,
                password_hash,
                role
              )
              VALUES (?, ?, ?, ?)
            `,
            [
              fullName,
              email,
              passwordHash,
              role
            ],
            (insertError) => {
              if (insertError) {
                console.error(
                  'Registration Insert Error:',
                  insertError
                );

                return res
                  .status(500)
                  .json({
                    success: false,
                    message:
                      'Registration failed.'
                  });
              }

              return res
                .status(201)
                .json({
                  success: true,
                  message:
                    'Registration successful. Please login.'
                });
            }
          );
        } catch (hashError) {
          console.error(
            'Password Hash Error:',
            hashError
          );

          return res.status(500).json({
            success: false,
            message:
              'Could not secure the password.'
          });
        }
      }
    );
  }
);

// LOGIN
router.post(
  '/login',
  (req, res) => {
    const email =
      normalizeEmail(req.body.email);

    const password = String(
      req.body.password || ''
    );

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required.'
      });
    }

    db.query(
      `
        SELECT *
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email],
      async (error, rows) => {
        if (error) {
          console.error(
            'Login Database Error:',
            error
          );

          return res.status(500).json({
            success: false,
            message:
              'Database error.'
          });
        }

        if (rows.length === 0) {
          return res.status(401).json({
            success: false,
            message:
              'Invalid email or password.'
          });
        }

        const user = rows[0];

        if (
          Boolean(user.is_suspended)
        ) {
          return res.status(403).json({
            success: false,
            message:
              'Your account has been suspended.'
          });
        }

        try {
          const matches =
            await bcrypt.compare(
              password,
              user.password_hash
            );

          if (!matches) {
            return res
              .status(401)
              .json({
                success: false,
                message:
                  'Invalid email or password.'
              });
          }

          const token = jwt.sign(
            {
              id: user.user_id,
              role: user.role,
              email: user.email
            },
            JWT_SECRET,
            {
              expiresIn:
                JWT_EXPIRE
            }
          );

          return res.json({
            success: true,
            message:
              'Login successful.',
            token,
            user: publicUser(user)
          });
        } catch (
          compareError
        ) {
          console.error(
            'Password Compare Error:',
            compareError
          );

          return res.status(500).json({
            success: false,
            message:
              'Login failed.'
          });
        }
      }
    );
  }
);

// GET PROFILE
router.get(
  '/profile',
  verifyToken,
  (req, res) => {
    db.query(
      `
        SELECT
          user_id,
          full_name,
          email,
          role,
          profile_picture,
          bio,
          skills,
          experience,
          portfolio_url,
          created_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [req.user.id],
      (error, rows) => {
        if (error) {
          console.error(
            'Get Profile Error:',
            error
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Database error.'
            });
        }

        if (
          rows.length === 0
        ) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                'User not found.'
            });
        }

        return res.json({
          success: true,
          user: rows[0]
        });
      }
    );
  }
);

// UPLOAD / REPLACE PROFILE PICTURE
router.post(
  '/profile-picture',
  verifyToken,
  uploadProfilePicture,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          'Please choose an image to upload.'
      });
    }

    const newPicturePath =
      `/uploads/profiles/${req.file.filename}`;

    db.query(
      `
        SELECT profile_picture
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [req.user.id],
      (
        selectError,
        rows
      ) => {
        if (selectError) {
          console.error(
            'Profile Picture Lookup Error:',
            selectError
          );

          fs.unlink(
            req.file.path,
            () => {}
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Could not upload profile picture.'
            });
        }

        if (
          rows.length === 0
        ) {
          fs.unlink(
            req.file.path,
            () => {}
          );

          return res
            .status(404)
            .json({
              success: false,
              message:
                'User not found.'
            });
        }

        const oldPicturePath =
          rows[0]
            .profile_picture;

        db.query(
          `
            UPDATE users
            SET profile_picture = ?
            WHERE user_id = ?
          `,
          [
            newPicturePath,
            req.user.id
          ],
          (updateError) => {
            if (
              updateError
            ) {
              console.error(
                'Profile Picture Update Error:',
                updateError
              );

              fs.unlink(
                req.file.path,
                () => {}
              );

              return res
                .status(500)
                .json({
                  success:
                    false,
                  message:
                    'Could not save profile picture.'
                });
            }

            if (
              oldPicturePath &&
              oldPicturePath.startsWith(
                '/uploads/profiles/'
              )
            ) {
              const oldFileName =
                path.basename(
                  oldPicturePath
                );

              const oldAbsolutePath =
                path.join(
                  profileUploadDir,
                  oldFileName
                );

              fs.unlink(
                oldAbsolutePath,
                () => {}
              );
            }

            return res.json({
              success: true,
              message:
                'Profile picture updated successfully.',
              profile_picture:
                newPicturePath
            });
          }
        );
      }
    );
  }
);

// UPDATE PROFILE
router.put(
  '/profile',
  verifyToken,
  (req, res) => {
    const fullName = String(
      req.body.full_name || ''
    ).trim();

    const {
      bio,
      skills,
      experience,
      portfolio_url
    } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message:
          'Full name is required.'
      });
    }

    db.query(
      `
        UPDATE users
        SET
          full_name = ?,
          bio = ?,
          skills = ?,
          experience = ?,
          portfolio_url = ?
        WHERE user_id = ?
      `,
      [
        fullName,
        bio || null,
        skills || null,
        experience || null,
        portfolio_url || null,
        req.user.id
      ],
      (
        error,
        result
      ) => {
        if (error) {
          console.error(
            'Update Profile Error:',
            error
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Could not update profile.'
            });
        }

        if (
          result.affectedRows ===
          0
        ) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                'User not found.'
            });
        }

        return res.json({
          success: true,
          message:
            'Profile updated successfully.'
        });
      }
    );
  }
);

// FORGOT PASSWORD
router.post(
  '/forgot-password',
  (req, res) => {
    const email =
      normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          'Email is required.'
      });
    }

    db.query(
      `
        SELECT user_id
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email],
      (
        error,
        rows
      ) => {
        if (error) {
          console.error(
            'Forgot Password User Error:',
            error
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Database error.'
            });
        }

        if (
          rows.length === 0
        ) {
          return res.json({
            success: true,
            message:
              'If the email exists, a reset token has been generated.'
          });
        }

        const rawToken =
          crypto
            .randomBytes(32)
            .toString('hex');

        const tokenHash =
          crypto
            .createHash(
              'sha256'
            )
            .update(rawToken)
            .digest('hex');

        const expiresAt =
          new Date(
            Date.now() +
              30 *
                60 *
                1000
          );

        db.query(
          `
            DELETE FROM password_reset_tokens
            WHERE user_id = ?
               OR expires_at < NOW()
          `,
          [
            rows[0].user_id
          ],
          (
            deleteError
          ) => {
            if (
              deleteError
            ) {
              console.error(
                'Delete Reset Token Error:',
                deleteError
              );

              return res
                .status(500)
                .json({
                  success:
                    false,
                  message:
                    'Could not create reset token.'
                });
            }

            db.query(
              `
                INSERT INTO password_reset_tokens (
                  user_id,
                  token_hash,
                  expires_at
                )
                VALUES (?, ?, ?)
              `,
              [
                rows[0]
                  .user_id,
                tokenHash,
                expiresAt
              ],
              (
                insertError
              ) => {
                if (
                  insertError
                ) {
                  console.error(
                    'Insert Reset Token Error:',
                    insertError
                  );

                  return res
                    .status(500)
                    .json({
                      success:
                        false,
                      message:
                        'Could not create reset token.'
                    });
                }

                return res.json({
                  success: true,
                  message:
                    'Reset token generated. It expires in 30 minutes.',
                  resetToken:
                    rawToken
                });
              }
            );
          }
        );
      }
    );
  }
);

// RESET PASSWORD
router.post(
  '/reset-password',
  (req, res) => {
    const resetToken = String(
      req.body.resetToken || ''
    ).trim();

    const newPassword = String(
      req.body.newPassword || ''
    );

    if (
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Reset token and new password are required.'
      });
    }

    if (
      newPassword.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters.'
      });
    }

    const tokenHash =
      crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    db.query(
      `
        SELECT
          token_id,
          user_id
        FROM password_reset_tokens
        WHERE token_hash = ?
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
      `,
      [tokenHash],
      async (
        error,
        rows
      ) => {
        if (error) {
          console.error(
            'Reset Password Token Error:',
            error
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Database error.'
            });
        }

        if (
          rows.length === 0
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                'Reset token is invalid or expired.'
            });
        }

        try {
          const passwordHash =
            await bcrypt.hash(
              newPassword,
              SALT_ROUNDS
            );

          db.getConnection(
            (
              connectionError,
              connection
            ) => {
              if (
                connectionError
              ) {
                console.error(
                  'Reset Password Connection Error:',
                  connectionError
                );

                return res
                  .status(500)
                  .json({
                    success:
                      false,
                    message:
                      'Password reset failed.'
                  });
              }

              const releaseConnection =
                () => {
                  connection.release();
                };

              connection.beginTransaction(
                (
                  transactionError
                ) => {
                  if (
                    transactionError
                  ) {
                    console.error(
                      'Reset Password Transaction Error:',
                      transactionError
                    );

                    releaseConnection();

                    return res
                      .status(500)
                      .json({
                        success:
                          false,
                        message:
                          'Password reset failed.'
                      });
                  }

                  connection.query(
                    `
                      UPDATE users
                      SET password_hash = ?
                      WHERE user_id = ?
                    `,
                    [
                      passwordHash,
                      rows[0]
                        .user_id
                    ],
                    (
                      updateError,
                      updateResult
                    ) => {
                      if (
                        updateError ||
                        updateResult
                          .affectedRows ===
                          0
                      ) {
                        return connection.rollback(
                          () => {
                            console.error(
                              'Reset Password User Update Error:',
                              updateError
                            );

                            releaseConnection();

                            return res
                              .status(500)
                              .json({
                                success:
                                  false,
                                message:
                                  'Password reset failed.'
                              });
                          }
                        );
                      }

                      connection.query(
                        `
                          UPDATE password_reset_tokens
                          SET used_at = NOW()
                          WHERE token_id = ?
                            AND used_at IS NULL
                        `,
                        [
                          rows[0]
                            .token_id
                        ],
                        (
                          tokenError,
                          tokenResult
                        ) => {
                          if (
                            tokenError ||
                            tokenResult
                              .affectedRows ===
                              0
                          ) {
                            return connection.rollback(
                              () => {
                                console.error(
                                  'Reset Password Token Update Error:',
                                  tokenError
                                );

                                releaseConnection();

                                return res
                                  .status(500)
                                  .json({
                                    success:
                                      false,
                                    message:
                                      'Password reset failed.'
                                  });
                              }
                            );
                          }

                          connection.commit(
                            (
                              commitError
                            ) => {
                              if (
                                commitError
                              ) {
                                return connection.rollback(
                                  () => {
                                    console.error(
                                      'Reset Password Commit Error:',
                                      commitError
                                    );

                                    releaseConnection();

                                    return res
                                      .status(500)
                                      .json({
                                        success:
                                          false,
                                        message:
                                          'Password reset failed.'
                                      });
                                  }
                                );
                              }

                              releaseConnection();

                              return res.json({
                                success:
                                  true,
                                message:
                                  'Password reset successful. Please login.'
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        } catch (
          hashError
        ) {
          console.error(
            'Reset Password Hash Error:',
            hashError
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Password reset failed.'
            });
        }
      }
    );
  }
);

module.exports = router;