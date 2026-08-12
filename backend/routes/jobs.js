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
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Only clients can use protected client operations
const clientOnly = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Only clients can perform this action'
    });
  }

  next();
};

// GET ALL OPEN JOBS
router.get('/', auth, (req, res) => {
  const {
    search,
    category_id,
    minBudget,
    maxBudget,
    sort
  } = req.query;

  let query = `
    SELECT
      j.job_id,
      j.client_id,
      j.category_id,
      j.title,
      j.description,
      j.budget,
      j.status,
      j.created_at,
      c.name AS category_name,
      u.full_name AS client_name
    FROM jobs j
    LEFT JOIN categories c
      ON j.category_id = c.category_id
    LEFT JOIN users u
      ON j.client_id = u.user_id
    WHERE j.status = 'open'
  `;

  const params = [];

 if (search && search.trim()) {
  const normalizedSearch = search
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

  query += `
    AND (
      LOWER(
        REPLACE(
          REPLACE(j.title, '-', ' '),
          '_',
          ' '
        )
      ) LIKE ?

      OR

      LOWER(
        REPLACE(
          REPLACE(j.description, '-', ' '),
          '_',
          ' '
        )
      ) LIKE ?
    )
  `;

  params.push(
    `%${normalizedSearch}%`,
    `%${normalizedSearch}%`
  );
}

  if (
    category_id &&
    category_id !== 'all' &&
    !Number.isNaN(Number(category_id))
  ) {
    query += ` AND j.category_id = ?`;
    params.push(Number(category_id));
  }

  if (
    minBudget !== undefined &&
    minBudget !== '' &&
    !Number.isNaN(Number(minBudget))
  ) {
    query += ` AND j.budget >= ?`;
    params.push(Number(minBudget));
  }

  if (
    maxBudget !== undefined &&
    maxBudget !== '' &&
    !Number.isNaN(Number(maxBudget))
  ) {
    query += ` AND j.budget <= ?`;
    params.push(Number(maxBudget));
  }

  if (sort === 'budget_high') {
    query += ` ORDER BY j.budget DESC, j.created_at DESC`;
  } else if (sort === 'budget_low') {
    query += ` ORDER BY j.budget ASC, j.created_at DESC`;
  } else {
    query += ` ORDER BY j.created_at DESC`;
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Get Jobs Error:', err);

      return res.status(500).json({
        success: false,
        message: 'Failed to load jobs'
      });
    }

    return res.json({
      success: true,
      jobs: results || []
    });
  });
});

// GET MY JOBS
router.get('/my-jobs', auth, clientOnly, (req, res) => {
  const query = `
    SELECT
      j.job_id,
      j.client_id,
      j.category_id,
      j.title,
      j.description,
      j.budget,
      j.status,
      j.created_at,
      c.name AS category_name,
      COUNT(DISTINCT p.proposal_id) AS total_proposals
    FROM jobs j
    LEFT JOIN categories c
      ON j.category_id = c.category_id
    LEFT JOIN proposals p
      ON j.job_id = p.job_id
    WHERE j.client_id = ?
    GROUP BY
      j.job_id,
      j.client_id,
      j.category_id,
      j.title,
      j.description,
      j.budget,
      j.status,
      j.created_at,
      c.name
    ORDER BY j.created_at DESC
  `;

  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('My Jobs Error:', err);

      return res.status(500).json({
        success: false,
        message: 'Failed to load your jobs'
      });
    }

    return res.json({
      success: true,
      jobs: results || []
    });
  });
});

// GET CATEGORIES
router.get('/categories', auth, (req, res) => {
  const query = `
    SELECT category_id, name
    FROM categories
    ORDER BY name ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Categories Error:', err);

      return res.status(500).json({
        success: false,
        message: 'Failed to load categories'
      });
    }

    return res.json({
      success: true,
      categories: results || []
    });
  });
});

// POST NEW JOB
router.post('/', auth, clientOnly, (req, res) => {
  const {
    title,
    category_id,
    description,
    budget
  } = req.body;

  const clientId = req.user.id;
  const categoryId = Number(category_id);
  const jobBudget = Number(budget);

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Job title is required'
    });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Job description is required'
    });
  }

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Please select a valid category'
    });
  }

  if (!Number.isFinite(jobBudget) || jobBudget <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid budget'
    });
  }

  // Check whether the category exists
  db.query(
    `SELECT category_id FROM categories WHERE category_id = ?`,
    [categoryId],
    (categoryError, categoryResults) => {
      if (categoryError) {
        console.error('Category Check Error:', categoryError);

        return res.status(500).json({
          success: false,
          message: 'Failed to validate category'
        });
      }

      if (categoryResults.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Selected category does not exist'
        });
      }

      const insertQuery = `
        INSERT INTO jobs (
          client_id,
          category_id,
          title,
          description,
          budget,
          status
        )
        VALUES (?, ?, ?, ?, ?, 'open')
      `;

      db.query(
        insertQuery,
        [
          clientId,
          categoryId,
          title.trim(),
          description.trim(),
          jobBudget
        ],
        (insertError, result) => {
          if (insertError) {
            console.error('Post Job Error:', insertError);

            return res.status(500).json({
              success: false,
              message: 'Failed to post job'
            });
          }

          return res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            job_id: result.insertId
          });
        }
      );
    }
  );
});

// GET SINGLE JOB
router.get('/:id', auth, (req, res) => {
  const jobId = Number(req.params.id);

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job ID'
    });
  }

  const query = `
    SELECT
      j.*,
      c.name AS category_name,
      u.full_name AS client_name,
      u.email AS client_email
    FROM jobs j
    LEFT JOIN categories c
      ON j.category_id = c.category_id
    JOIN users u
      ON j.client_id = u.user_id
    WHERE j.job_id = ?
  `;

  db.query(query, [jobId], (err, results) => {
    if (err) {
      console.error('Single Job Error:', err);

      return res.status(500).json({
        success: false,
        message: 'Failed to load job'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    console.log('SINGLE JOB RESULT:', results[0]);

    return res.json({
      success: true,
      job: results[0]
    });
  });
});

// UPDATE JOB
router.put('/:id', auth, clientOnly, (req, res) => {
  const jobId = Number(req.params.id);

  const {
    title,
    category_id,
    description,
    budget,
    status
  } = req.body;

  const categoryId = Number(category_id);
  const jobBudget = Number(budget);

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job ID'
    });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Job title is required'
    });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Job description is required'
    });
  }

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Please select a valid category'
    });
  }

  if (!Number.isFinite(jobBudget) || jobBudget <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid budget'
    });
  }

  const allowedStatuses = [
    'open',
    'in_progress',
    'completed',
    'closed'
  ];

  const selectedStatus = status || 'open';

  if (!allowedStatuses.includes(selectedStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job status'
    });
  }

  const updateQuery = `
    UPDATE jobs
    SET
      title = ?,
      category_id = ?,
      description = ?,
      budget = ?,
      status = ?
    WHERE job_id = ?
      AND client_id = ?
  `;

  db.query(
    updateQuery,
    [
      title.trim(),
      categoryId,
      description.trim(),
      jobBudget,
      selectedStatus,
      jobId,
      req.user.id
    ],
    (err, result) => {
      if (err) {
        console.error('Update Job Error:', err);

        return res.status(500).json({
          success: false,
          message: 'Failed to update job'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found or you are not the owner'
        });
      }

      return res.json({
        success: true,
        message: 'Job updated successfully'
      });
    }
  );
});

// DELETE JOB
router.delete('/:id', auth, clientOnly, (req, res) => {
  const jobId = Number(req.params.id);

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job ID'
    });
  }

  const deleteQuery = `
    DELETE FROM jobs
    WHERE job_id = ?
      AND client_id = ?
  `;

  db.query(
    deleteQuery,
    [jobId, req.user.id],
    (err, result) => {
      if (err) {
        console.error('Delete Job Error:', err);

        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(409).json({
            success: false,
            message:
              'This job cannot be deleted because it has related proposals'
          });
        }

        return res.status(500).json({
          success: false,
          message: 'Failed to delete job'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found or you are not the owner'
        });
      }

      return res.json({
        success: true,
        message: 'Job deleted successfully'
      });
    }
  );
});

module.exports = router;