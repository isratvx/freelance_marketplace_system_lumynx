const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
const auth = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in.'
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Freelancer-only middleware
const freelancerOnly = (req, res, next) => {
  if (req.user.role !== 'freelancer') {
    return res.status(403).json({
      success: false,
      message: 'Only freelancers can perform this action'
    });
  }

  next();
};

// Client-only middleware
const clientOnly = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Only clients can perform this action'
    });
  }

  next();
};

// GET MY SUBMITTED PROPOSALS
// GET /api/proposals/my
router.get('/my', auth, freelancerOnly, (req, res) => {
  const query = `
    SELECT
      p.proposal_id,
      p.job_id,
      p.cover_letter,
      p.bid_amount,
      p.delivery_time,
      p.status,
      p.created_at,
      j.title,
      j.budget AS job_budget,
      j.status AS job_status,
      c.name AS category_name
    FROM proposals p
    JOIN jobs j
      ON p.job_id = j.job_id
    LEFT JOIN categories c
      ON j.category_id = c.category_id
    WHERE p.freelancer_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('My Proposals Error:', err);

      return res.status(500).json({
        success: false,
        message: 'Failed to load proposals'
      });
    }

    return res.json({
      success: true,
      proposals: results || []
    });
  });
});

// GET PROPOSALS RECEIVED BY CLIENT
// GET /api/proposals/client
router.get('/client', auth, clientOnly, (req, res) => {
  const query = `
    SELECT
      p.proposal_id,
      p.job_id,
      p.freelancer_id,
      p.cover_letter,
      p.bid_amount,
      p.delivery_time,
      p.status,
      p.created_at,
      j.title AS job_title,
      j.budget AS job_budget,
      j.status AS job_status,
      u.full_name AS freelancer_name,
      u.email AS freelancer_email
    FROM proposals p
    JOIN jobs j
      ON p.job_id = j.job_id
    JOIN users u
      ON p.freelancer_id = u.user_id
    WHERE j.client_id = ?
    ORDER BY
      j.created_at DESC,
      p.created_at DESC
  `;

  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Received Proposals Error:', err);

      return res.status(500).json({
        success: false,
        message: 'Failed to load received proposals'
      });
    }

    return res.json({
      success: true,
      proposals: results || []
    });
  });
});

// SUBMIT A PROPOSAL
// POST /api/proposals
router.post('/', auth, freelancerOnly, (req, res) => {
  const {
    job_id,
    cover_letter,
    bid_amount,
    delivery_time
  } = req.body;

  const jobId = Number(job_id);
  const bidAmount = Number(bid_amount);
  const deliveryTime = Number(delivery_time);
  const freelancerId = req.user.id;

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job'
    });
  }

  if (!cover_letter || !cover_letter.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Cover letter is required'
    });
  }

  if (cover_letter.trim().length < 20) {
    return res.status(400).json({
      success: false,
      message: 'Cover letter must contain at least 20 characters'
    });
  }

  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid bid amount'
    });
  }

  if (!Number.isInteger(deliveryTime) || deliveryTime < 1) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid delivery time in days'
    });
  }

  const jobQuery = `
    SELECT job_id, client_id, status
    FROM jobs
    WHERE job_id = ?
  `;

  db.query(jobQuery, [jobId], (jobError, jobResults) => {
    if (jobError) {
      console.error('Job Check Error:', jobError);

      return res.status(500).json({
        success: false,
        message: 'Failed to check job'
      });
    }

    if (jobResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const job = jobResults[0];

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting proposals'
      });
    }

    if (Number(job.client_id) === Number(freelancerId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a proposal to your own job'
      });
    }

    const duplicateQuery = `
      SELECT proposal_id
      FROM proposals
      WHERE job_id = ?
        AND freelancer_id = ?
    `;

    db.query(
      duplicateQuery,
      [jobId, freelancerId],
      (duplicateError, duplicateResults) => {
        if (duplicateError) {
          console.error(
            'Duplicate Proposal Check Error:',
            duplicateError
          );

          return res.status(500).json({
            success: false,
            message: 'Failed to check existing proposal'
          });
        }

        if (duplicateResults.length > 0) {
          return res.status(409).json({
            success: false,
            message:
              'You have already submitted a proposal for this job'
          });
        }

        const insertQuery = `
          INSERT INTO proposals (
            job_id,
            freelancer_id,
            cover_letter,
            bid_amount,
            delivery_time,
            status
          )
          VALUES (?, ?, ?, ?, ?, 'pending')
        `;

        db.query(
          insertQuery,
          [
            jobId,
            freelancerId,
            cover_letter.trim(),
            bidAmount,
            deliveryTime
          ],
          (insertError, result) => {
            if (insertError) {
              console.error(
                'Submit Proposal Error:',
                insertError
              );

              return res.status(500).json({
                success: false,
                message: 'Failed to submit proposal'
              });
            }

            return res.status(201).json({
              success: true,
              message: 'Proposal submitted successfully',
              proposal_id: result.insertId
            });
          }
        );
      }
    );
  });
});

// ACCEPT OR REJECT A PROPOSAL
// PUT /api/proposals/:proposalId/status
router.put(
  '/:proposalId/status',
  auth,
  clientOnly,
  (req, res) => {
    const proposalId = Number(req.params.proposalId);
    const { status } = req.body;

    if (!Number.isInteger(proposalId) || proposalId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid proposal ID'
      });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be accepted or rejected'
      });
    }

    const proposalQuery = `
      SELECT
        p.proposal_id,
        p.job_id,
        p.status,
        j.client_id,
        j.status AS job_status
      FROM proposals p
      JOIN jobs j
        ON p.job_id = j.job_id
      WHERE p.proposal_id = ?
        AND j.client_id = ?
    `;

    db.query(
      proposalQuery,
      [proposalId, req.user.id],
      (proposalError, proposalResults) => {
        if (proposalError) {
          console.error(
            'Proposal Ownership Error:',
            proposalError
          );

          return res.status(500).json({
            success: false,
            message: 'Failed to check proposal'
          });
        }

        if (proposalResults.length === 0) {
          return res.status(404).json({
            success: false,
            message:
              'Proposal not found or you do not own this job'
          });
        }

        const proposal = proposalResults[0];

        if (proposal.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: `This proposal is already ${proposal.status}`
          });
        }

        // REJECT DOES NOT NEED A TRANSACTION
        if (status === 'rejected') {
          db.query(
            `
              UPDATE proposals
              SET status = 'rejected'
              WHERE proposal_id = ?
                AND status = 'pending'
            `,
            [proposalId],
            (rejectError, rejectResult) => {
              if (rejectError) {
                console.error(
                  'Reject Proposal Error:',
                  rejectError
                );

                return res.status(500).json({
                  success: false,
                  message: 'Failed to reject proposal'
                });
              }

              if (rejectResult.affectedRows === 0) {
                return res.status(400).json({
                  success: false,
                  message:
                    'Proposal status could not be changed'
                });
              }

              return res.json({
                success: true,
                message:
                  'Proposal rejected successfully'
              });
            }
          );

          return;
        }

        // ACCEPT PROPOSAL
        // A transaction must use ONE connection from the pool.
        db.getConnection(
          (connectionError, connection) => {
            if (connectionError) {
              console.error(
                'Get Transaction Connection Error:',
                connectionError
              );

              return res.status(500).json({
                success: false,
                message:
                  'Failed to start proposal acceptance'
              });
            }

            const releaseConnection = () => {
              connection.release();
            };

            connection.beginTransaction(
              (transactionError) => {
                if (transactionError) {
                  console.error(
                    'Transaction Error:',
                    transactionError
                  );

                  releaseConnection();

                  return res.status(500).json({
                    success: false,
                    message:
                      'Failed to start proposal acceptance'
                  });
                }

                // 1. Accept selected proposal
                connection.query(
                  `
                    UPDATE proposals
                    SET status = 'accepted'
                    WHERE proposal_id = ?
                      AND status = 'pending'
                  `,
                  [proposalId],
                  (acceptError, acceptResult) => {
                    if (
                      acceptError ||
                      acceptResult.affectedRows === 0
                    ) {
                      return connection.rollback(() => {
                        console.error(
                          'Accept Proposal Error:',
                          acceptError
                        );

                        releaseConnection();

                        return res.status(500).json({
                          success: false,
                          message:
                            'Failed to accept proposal'
                        });
                      });
                    }

                    // 2. Reject all other pending proposals
                    // for the same job
                    connection.query(
                      `
                        UPDATE proposals
                        SET status = 'rejected'
                        WHERE job_id = ?
                          AND proposal_id <> ?
                          AND status = 'pending'
                      `,
                      [
                        proposal.job_id,
                        proposalId
                      ],
                      (rejectOthersError) => {
                        if (rejectOthersError) {
                          return connection.rollback(
                            () => {
                              console.error(
                                'Reject Other Proposals Error:',
                                rejectOthersError
                              );

                              releaseConnection();

                              return res.status(500).json({
                                success: false,
                                message:
                                  'Failed to update other proposals'
                              });
                            }
                          );
                        }

                        // 3. Move the job to in_progress
                        connection.query(
                          `
                            UPDATE jobs
                            SET status = 'in_progress'
                            WHERE job_id = ?
                              AND client_id = ?
                              AND status = 'open'
                          `,
                          [
                            proposal.job_id,
                            req.user.id
                          ],
                          (
                            jobUpdateError,
                            jobUpdateResult
                          ) => {
                            if (
                              jobUpdateError ||
                              jobUpdateResult.affectedRows === 0
                            ) {
                              return connection.rollback(
                                () => {
                                  console.error(
                                    'Job Status Update Error:',
                                    jobUpdateError
                                  );

                                  releaseConnection();

                                  return res.status(500).json({
                                    success: false,
                                    message:
                                      'Failed to update job status'
                                  });
                                }
                              );
                            }

                            // 4. Commit all three changes
                            connection.commit(
                              (commitError) => {
                                if (commitError) {
                                  return connection.rollback(
                                    () => {
                                      console.error(
                                        'Commit Error:',
                                        commitError
                                      );

                                      releaseConnection();

                                      return res
                                        .status(500)
                                        .json({
                                          success: false,
                                          message:
                                            'Failed to complete acceptance'
                                        });
                                    }
                                  );
                                }

                                releaseConnection();

                                return res.json({
                                  success: true,
                                  message:
                                    'Proposal accepted and job moved to In Progress'
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
          }
        );
      }
    );
  }
);

module.exports = router;