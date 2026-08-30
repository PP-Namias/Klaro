-- Consent records for the mandatory pre-upload consent gate.
--
-- Holds proof that a user accepted the Terms of Service, Terms & Conditions and
-- the medical disclaimer before any medical document was read (RA 10173).
-- Contains NO medical content, so it is compatible with the zero-storage rule.

CREATE TABLE IF NOT EXISTS consent_record (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       text,
    session_id    text,
    terms_version varchar(32) NOT NULL,
    accepted_at   timestamp NOT NULL DEFAULT now(),
    ip_address    varchar(45),
    user_agent    text,
    created_at    timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_record_user_id_idx ON consent_record (user_id);
CREATE INDEX IF NOT EXISTS consent_record_session_id_idx ON consent_record (session_id);
CREATE INDEX IF NOT EXISTS consent_record_accepted_at_idx ON consent_record (accepted_at);
