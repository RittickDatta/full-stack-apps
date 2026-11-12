# ChatRoom Security

## Overview

ChatRoom is a temporary, room-based chat application.

It does not require permanent user accounts.

Security is enforced primarily through server-side validation, socket-session authorization, and room membership checks.

## Input Validation

ChatRoom uses shared Zod schemas to validate incoming requests.

Examples include:

- Display names
- Room codes
- Chat messages
- Room operation payloads

Invalid requests return structured acknowledgement errors.

## Authorization

The server maintains participant and room membership information.

Creator-only operations require valid creator authorization.

Client-provided role information is not sufficient to grant creator privileges.

## Rate Limiting

ChatRoom limits selected room and chat operations to reduce abuse and excessive resource consumption.

Rate limiting is enforced on the backend.

## Origin Restrictions

Socket.IO connections are restricted using configured browser origins.

Origin restrictions are not authentication; non-browser clients can forge Origin headers.

## Payload Limits

The backend limits Socket.IO payload sizes and validates message content.

## Sensitive Data

The application should not expose creator tokens in public URLs or server logs.

Structured logs should exclude chat content, authorization tokens, and full room snapshots.

## Storage

Rooms and messages are stored in memory.

Data is temporary and is not preserved across backend restarts.

## Security Limitations

- No permanent user accounts.
- No end-to-end encryption.
- No persistent message storage.
- Single-instance architecture.
- No guarantee of session restoration after disconnection.

## Reporting Security Issues

If this repository is public, provide a private contact method or GitHub security reporting instructions for responsible disclosure.
