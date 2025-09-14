/**
 * Type definitions for Opinion Front UI
 * Migration from servlet-based application types
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User types (migrated from servlet session)
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created: Date;
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

// Opinion/Content types
export interface Opinion {
  id: number;
  title: string;
  content: string;
  author: User;
  created: Date;
  updated?: Date;
  status: OpinionStatus;
  tags: string[];
}

// Survey types (for MockApiService compatibility)
export interface Survey {
  id: number;
  title: string;
  description: string;
  status: OpinionStatus;
  created: Date;
  updated?: Date;
  responses: number;
  completionRate: number;
}

export enum OpinionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Application state types
export interface AppState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Event types for application events
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: Date;
}

// API endpoint configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}
