-- Freelance Marketplace System
-- MySQL 8.0+

DROP DATABASE IF EXISTS freelance_marketplace_system_v2;

CREATE DATABASE freelance_marketplace_system_v2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE freelance_marketplace_system_v2;


-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('client', 'freelancer', 'admin') NOT NULL,

  profile_picture VARCHAR(255) NULL,
  bio TEXT NULL,
  skills VARCHAR(500) NULL,
  experience TEXT NULL,
  portfolio_url VARCHAR(255) NULL,

  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_role (role),

  INDEX idx_users_suspended (
    is_suspended
  )
) ENGINE=InnoDB;


-- =========================================
-- CATEGORIES
-- =========================================

CREATE TABLE categories (
  category_id INT UNSIGNED
    AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(100)
    NOT NULL UNIQUE,

  created_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================
-- JOBS
-- =========================================

CREATE TABLE jobs (
  job_id INT UNSIGNED
    AUTO_INCREMENT PRIMARY KEY,

  client_id INT UNSIGNED NOT NULL,

  category_id INT UNSIGNED NOT NULL,

  title VARCHAR(180) NOT NULL,

  description TEXT NOT NULL,

  budget DECIMAL(12,2) NOT NULL,

  status ENUM(
    'open',
    'in_progress',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'open',

  accepted_proposal_id
    INT UNSIGNED NULL,

  created_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_jobs_budget
    CHECK (budget > 0),

  CONSTRAINT fk_jobs_client
    FOREIGN KEY (client_id)
    REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_jobs_category
    FOREIGN KEY (category_id)
    REFERENCES categories(category_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_jobs_client (
    client_id
  ),

  INDEX idx_jobs_category (
    category_id
  ),

  INDEX idx_jobs_status_created (
    status,
    created_at
  ),

  FULLTEXT INDEX
    ft_jobs_title_description (
      title,
      description
    )
) ENGINE=InnoDB;


-- =========================================
-- PROPOSALS
-- =========================================

CREATE TABLE proposals (
  proposal_id INT UNSIGNED
    AUTO_INCREMENT PRIMARY KEY,

  job_id INT UNSIGNED NOT NULL,

  freelancer_id INT UNSIGNED NOT NULL,

  cover_letter TEXT NOT NULL,

  bid_amount DECIMAL(12,2) NOT NULL,

  delivery_time INT UNSIGNED
    NOT NULL
    COMMENT 'Delivery time in days',

  status ENUM(
    'pending',
    'accepted',
    'rejected',
    'withdrawn'
  ) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_proposals_bid
    CHECK (bid_amount > 0),

  CONSTRAINT chk_proposals_delivery
    CHECK (delivery_time > 0),

  CONSTRAINT fk_proposals_job
    FOREIGN KEY (job_id)
    REFERENCES jobs(job_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_proposals_freelancer
    FOREIGN KEY (freelancer_id)
    REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT uq_proposal_per_job
    UNIQUE (
      job_id,
      freelancer_id
    ),

  INDEX idx_proposals_freelancer (
    freelancer_id
  ),

  INDEX idx_proposals_job_status (
    job_id,
    status
  )
) ENGINE=InnoDB;


-- =========================================
-- ACCEPTED PROPOSAL RELATION
-- =========================================

ALTER TABLE jobs
  ADD CONSTRAINT
    fk_jobs_accepted_proposal

  FOREIGN KEY (
    accepted_proposal_id
  )

  REFERENCES proposals(
    proposal_id
  )

  ON UPDATE CASCADE
  ON DELETE SET NULL;


-- =========================================
-- PASSWORD RESET TOKENS
-- =========================================

CREATE TABLE password_reset_tokens (
  token_id BIGINT UNSIGNED
    AUTO_INCREMENT PRIMARY KEY,

  user_id INT UNSIGNED NOT NULL,

  token_hash CHAR(64)
    NOT NULL UNIQUE,

  expires_at DATETIME NOT NULL,

  used_at DATETIME NULL,

  created_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_reset_tokens_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  INDEX idx_reset_tokens_user_expiry (
    user_id,
    expires_at
  )
) ENGINE=InnoDB;


-- =========================================
-- INITIAL CATEGORIES
-- =========================================

INSERT INTO categories (name)
VALUES
  ('Web Development'),
  ('Mobile App Development'),
  ('Graphic Design'),
  ('UI/UX Design'),
  ('Content Writing'),
  ('Digital Marketing'),
  ('Data Entry'),
  ('Video Editing'),
  ('Database Management'),
  ('Other');