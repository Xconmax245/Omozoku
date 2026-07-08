import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  username: text('username').unique(),
  email: text('email').unique(),
  password: text('password'),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// App Tables
export const watchlists = pgTable('watchlist', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  animeId: integer('animeId').notNull(), // Jikan Anime ID
  status: text('status').notNull().default('watching'), // watching, completed, on_hold, dropped, plan_to_watch
  episodesWatched: integer('episodesWatched').notNull().default(0),
  addedAt: timestamp('addedAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

export const notifications = pgTable('notification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId'), // Nullable - null means global broadcast
  type: text('type').notNull(), // "build_update", "new_anime", "support_creator", "system"
  title: text('title').notNull(),
  body: text('body').notNull(),
  linkUrl: text('linkUrl'),
  icon: text('icon'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  isDismissible: boolean('isDismissible').default(true).notNull(),
  priority: integer('priority').default(0).notNull(), // 0 = normal chronological, 9999 = always-pinned-last
}, (table) => ({
  userIdCreatedAtIdx: index('notification_user_id_created_at_idx').on(table.userId, table.createdAt),
}));

export const userNotificationReads = pgTable('user_notification_read', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationId: text('notificationId').notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  readAt: timestamp('readAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.notificationId] }),
}));

export const watchProgress = pgTable('watch_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId'), // Optional for unauthenticated users
  sessionId: text('sessionId'), // Used for guest/unauthenticated viewers
  animeId: integer('animeId').notNull(), // Jikan Anime ID
  episode: integer('episode').notNull(),
  secondsWatched: integer('secondsWatched').notNull().default(0),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});
