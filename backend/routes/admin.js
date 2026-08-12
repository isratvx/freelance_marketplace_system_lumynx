const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// ========================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ========================================

const adminAuth = (req, res, next) => {
  const token =
    req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in.'
    });
  }

  try {
    const user = jwt.verify(
      token,
      JWT_SECRET
    );

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};


// ========================================
// GET DASHBOARD STATISTICS
// GET /api/admin/stats
// ========================================

router.get(
  '/stats',
  adminAuth,
  (req, res) => {
    const query = `
      SELECT

        (
          SELECT COUNT(*)
          FROM users
        ) AS total_users,

        (
          SELECT COUNT(*)
          FROM users
          WHERE role = 'freelancer'
        ) AS total_freelancers,

        (
          SELECT COUNT(*)
          FROM users
          WHERE role = 'client'
        ) AS total_clients,

        (
          SELECT COUNT(*)
          FROM users
          WHERE role = 'admin'
        ) AS total_admins,

        (
          SELECT COUNT(*)
          FROM users
          WHERE is_suspended = 1
        ) AS suspended_users,

        (
          SELECT COUNT(*)
          FROM jobs
        ) AS total_jobs,

        (
          SELECT COUNT(*)
          FROM jobs
          WHERE status = 'open'
        ) AS open_jobs,

        (
          SELECT COUNT(*)
          FROM jobs
          WHERE status = 'in_progress'
        ) AS in_progress_jobs,

        (
          SELECT COUNT(*)
          FROM jobs
          WHERE status = 'completed'
        ) AS completed_jobs,

        (
          SELECT COUNT(*)
          FROM proposals
        ) AS total_proposals,

        (
          SELECT COUNT(*)
          FROM proposals
          WHERE status = 'pending'
        ) AS pending_proposals,

        (
          SELECT COUNT(*)
          FROM proposals
          WHERE status = 'accepted'
        ) AS accepted_proposals
    `;

    db.query(
      query,
      (err, results) => {
        if (err) {
          console.error(
            'Admin Statistics Error:',
            err
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Failed to load dashboard statistics'
            });
        }

        return res.json({
          success: true,
          stats: results[0]
        });
      }
    );
  }
);


// ========================================
// GET ALL USERS
// GET /api/admin/users
// ========================================

router.get(
  '/users',
  adminAuth,
  (req, res) => {
    const query = `
      SELECT
        user_id,
        full_name,
        email,
        role,
        is_suspended,
        created_at
      FROM users
      ORDER BY created_at DESC
    `;

    db.query(
      query,
      (err, results) => {
        if (err) {
          console.error(
            'Admin Users Error:',
            err
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Failed to load users'
            });
        }

        return res.json({
          success: true,
          users: results || []
        });
      }
    );
  }
);


// ========================================
// SUSPEND / UNSUSPEND USER
// PUT /api/admin/users/:id/suspend
// ========================================

router.put(
  '/users/:id/suspend',
  adminAuth,
  (req, res) => {
    const userId =
      Number(req.params.id);

    const {
      is_suspended
    } = req.body;

    if (
      !Number.isInteger(userId) ||
      userId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (
      typeof is_suspended !==
      'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Suspension status must be true or false'
      });
    }

    if (
      Number(req.user.id) ===
      userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'You cannot suspend your own admin account'
      });
    }

    db.query(
      `
        SELECT
          user_id,
          role
        FROM users
        WHERE user_id = ?
      `,
      [userId],
      (
        userError,
        userResults
      ) => {
        if (userError) {
          console.error(
            'Admin User Check Error:',
            userError
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Failed to check user'
            });
        }

        if (
          userResults.length === 0
        ) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                'User not found'
            });
        }

        if (
          userResults[0].role ===
          'admin'
        ) {
          return res
            .status(403)
            .json({
              success: false,
              message:
                'Admin accounts cannot be suspended'
            });
        }

        db.query(
          `
            UPDATE users
            SET is_suspended = ?
            WHERE user_id = ?
          `,
          [
            is_suspended ? 1 : 0,
            userId
          ],
          (
            updateError,
            result
          ) => {
            if (updateError) {
              console.error(
                'Admin Update Suspension Error:',
                updateError
              );

              return res
                .status(500)
                .json({
                  success: false,
                  message:
                    'Failed to update user'
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
                    'User not found'
                });
            }

            return res.json({
              success: true,
              message: is_suspended
                ? 'User suspended successfully'
                : 'User unsuspended successfully'
            });
          }
        );
      }
    );
  }
);


// ========================================
// GET ALL JOBS
// GET /api/admin/jobs
// ========================================

router.get(
  '/jobs',
  adminAuth,
  (req, res) => {
    const query = `
      SELECT
        j.job_id,
        j.title,
        j.description,
        j.budget,
        j.status,
        j.created_at,

        u.full_name AS client_name,
        u.email AS client_email,

        c.name AS category_name,

        COUNT(
          DISTINCT p.proposal_id
        ) AS total_proposals

      FROM jobs j

      JOIN users u
        ON j.client_id = u.user_id

      LEFT JOIN categories c
        ON j.category_id =
           c.category_id

      LEFT JOIN proposals p
        ON j.job_id = p.job_id

      GROUP BY
        j.job_id,
        j.title,
        j.description,
        j.budget,
        j.status,
        j.created_at,
        u.full_name,
        u.email,
        c.name

      ORDER BY
        j.created_at DESC
    `;

    db.query(
      query,
      (err, results) => {
        if (err) {
          console.error(
            'Admin Jobs Error:',
            err
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Failed to load jobs'
            });
        }

        return res.json({
          success: true,
          jobs: results || []
        });
      }
    );
  }
);


// ========================================
// DELETE JOB
// DELETE /api/admin/jobs/:id
// ========================================

router.delete(
  '/jobs/:id',
  adminAuth,
  (req, res) => {
    const jobId =
      Number(req.params.id);

    if (
      !Number.isInteger(jobId) ||
      jobId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    db.query(
      `
        DELETE FROM jobs
        WHERE job_id = ?
      `,
      [jobId],
      (err, result) => {
        if (err) {
          console.error(
            'Admin Delete Job Error:',
            err
          );

          if (
            err.code ===
            'ER_ROW_IS_REFERENCED_2'
          ) {
            return res
              .status(409)
              .json({
                success: false,
                message:
                  'This job cannot be deleted because it has related proposals'
              });
          }

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Failed to delete job'
            });
        }

        if (
          result.affectedRows === 0
        ) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                'Job not found'
            });
        }

        return res.json({
          success: true,
          message:
            'Job deleted successfully'
        });
      }
    );
  }
);


// ========================================
// GET ALL PROPOSALS
// GET /api/admin/proposals
// ========================================

router.get(
  '/proposals',
  adminAuth,
  (req, res) => {
    const query = `
      SELECT
        p.proposal_id,
        p.bid_amount,
        p.delivery_time,
        p.status,
        p.created_at,

        j.title AS job_title,

        client.full_name
          AS client_name,

        freelancer.full_name
          AS freelancer_name,

        freelancer.email
          AS freelancer_email

      FROM proposals p

      JOIN jobs j
        ON p.job_id =
           j.job_id

      JOIN users client
        ON j.client_id =
           client.user_id

      JOIN users freelancer
        ON p.freelancer_id =
           freelancer.user_id

      ORDER BY
        p.created_at DESC
    `;

    db.query(
      query,
      (err, results) => {
        if (err) {
          console.error(
            'Admin Proposals Error:',
            err
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                'Failed to load proposals'
            });
        }

        return res.json({
          success: true,
          proposals:
            results || []
        });
      }
    );
  }
);


module.exports = router;