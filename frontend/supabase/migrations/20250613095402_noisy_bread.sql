-- Initialize the hrsurvey database
CREATE DATABASE IF NOT EXISTS hrsurvey;

-- Create users table (will be created by SQLAlchemy, but this ensures the database exists)
\c hrsurvey;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE hrsurvey TO postgres;