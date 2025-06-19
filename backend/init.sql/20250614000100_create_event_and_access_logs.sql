CREATE TABLE event_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_details JSONB,
    timestamp TIMESTAMPTZ DEFAULT now(),
    ip_address VARCHAR(45)
);

CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_role VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    accessed_at TIMESTAMPTZ DEFAULT now(),
    action VARCHAR(100)
); 