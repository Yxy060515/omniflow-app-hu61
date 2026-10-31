// Student-ID helpers shared by the backend auth routes and the frontend forms.
// Accounts are keyed by a 9-digit student ID; internally the ID maps to a
// synthetic email so the existing Users table and passport strategies are reused.

export const STUDENT_ID_PATTERN = /^\d{9}$/;
export const STUDENT_ID_LENGTH = 9;
export const STUDENT_EMAIL_DOMAIN = 'campus.student';

export const isValidStudentId = (value: string): boolean => STUDENT_ID_PATTERN.test(value);

export const studentIdToEmail = (studentId: string): string =>
  `${studentId}@${STUDENT_EMAIL_DOMAIN}`;

export const emailToStudentId = (email: string): string => email.split('@')[0] ?? '';
