import {cookies} from 'next/headers';

type TableName = 'users' | 'identities' | 'findings' | 'takedowns';

type TestUser = {
  id: string;
  email: string;
};

type UserRow = {
  id: string;
  auth_user_id: string;
  email: string;
  name?: string | null;
  plan?: string | null;
  billing_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  is_admin?: boolean | null;
};

type IdentityRow = {
  id: string;
  user_id: string;
  doc_type: string | null;
  doc_url: string | null;
  status?: string | null;
  verified_at: string | null;
  created_at: string;
};

type FindingRow = {
  id: string;
  user_id: string;
  url: string;
  source_type: string | null;
  status: string | null;
  created_at: string;
};

type TakedownRow = {
  id: string;
  finding_id: string;
  user_id: string;
  channel: string | null;
  submitted_at: string | null;
  created_at: string;
};

type RowMap = {
  users: UserRow;
  identities: IdentityRow;
  findings: FindingRow;
  takedowns: TakedownRow;
};

type RowsOf<T extends TableName> = RowMap[T][];

type TestStore = {
  authUser: TestUser;
  tables: {
    [K in TableName]: RowsOf<K>;
  };
  counters: Record<TableName, number>;
};

const GLOBAL_KEY = Symbol.for('wlm.supabaseTestStore');

type GlobalWithTestStore = typeof globalThis & {
  [GLOBAL_KEY]?: TestStore;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createDefaultStore(): TestStore {
  const now = new Date().toISOString();
  return {
    authUser: {
      id: 'auth-test-user',
      email: 'test@example.com'
    },
    tables: {
      users: [
        {
          id: 'user-1',
          auth_user_id: 'auth-test-user',
          email: 'test@example.com',
          name: 'Test User',
          plan: null,
          billing_status: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          is_admin: false
        }
      ],
      identities: [],
      findings: [
        {
          id: 'finding-1',
          user_id: 'user-1',
          url: 'https://example.com/infringing/1',
          source_type: 'search',
          status: 'Found',
          created_at: now
        },
        {
          id: 'finding-2',
          user_id: 'user-1',
          url: 'https://example.com/infringing/2',
          source_type: 'host',
          status: 'Submitted',
          created_at: now
        }
      ],
      takedowns: []
    },
    counters: {
      users: 1,
      identities: 0,
      findings: 2,
      takedowns: 0
    }
  };
}

function getGlobalStore(): TestStore {
  const globalWithStore = globalThis as GlobalWithTestStore;
  if (!globalWithStore[GLOBAL_KEY]) {
    globalWithStore[GLOBAL_KEY] = createDefaultStore();
  }
  return globalWithStore[GLOBAL_KEY]!;
}

export function resetTestStore() {
  const globalWithStore = globalThis as GlobalWithTestStore;
  globalWithStore[GLOBAL_KEY] = createDefaultStore();
}

function generateId(table: TableName, store: TestStore) {
  store.counters[table] += 1;
  return `${table}-${store.counters[table]}`;
}

function getRows<T extends TableName>(table: T, store: TestStore): RowsOf<T> {
  return store.tables[table] as RowsOf<T>;
}

type FilterFn<T extends TableName> = (row: RowMap[T]) => boolean;

type OrderConfig<T extends TableName> = {
  column: keyof RowMap[T];
  ascending: boolean;
};

type SelectBuilder<T extends TableName> = {
  eq<K extends keyof RowMap[T]>(column: K, value: RowMap[T][K]): SelectBuilder<T>;
  order<K extends keyof RowMap[T]>(column: K, options: {ascending?: boolean}): SelectBuilder<T>;
  limit(count: number): SelectBuilder<T>;
  single(): Promise<{data: RowMap[T] | null; error: {message: string} | null}>;
  maybeSingle(): Promise<{data: RowMap[T] | null; error: null}>;
  then<TResult = unknown>(
    onfulfilled?: ((value: {data: RowsOf<T>; error: null}) => TResult | Promise<TResult>) | undefined | null,
    onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null
  ): Promise<TResult>;
  catch: (...args: any[]) => SelectBuilder<T>;
};

type ModifyBuilder<T extends TableName> = {
  eq<K extends keyof RowMap[T]>(column: K, value: RowMap[T][K]): ModifyBuilder<T>;
  then<TResult = unknown>(
    onfulfilled?: ((value: {data: RowsOf<T>; error: null}) => TResult | Promise<TResult>) | undefined | null,
    onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null
  ): Promise<TResult>;
  catch: (...args: any[]) => ModifyBuilder<T>;
};

function createSelectBuilder<T extends TableName>(
  table: T,
  store: TestStore,
  initialFilters: FilterFn<T>[] = []
): SelectBuilder<T> {
  let filters = [...initialFilters];
  let orderConfig: OrderConfig<T> | null = null;
  let limitCount: number | null = null;

  const apply = (): RowsOf<T> => {
    let rows = [...getRows(table, store)];
    rows = rows.filter((row) => filters.every((fn) => fn(row)));
    if (orderConfig) {
      const {column, ascending} = orderConfig;
      rows = [...rows].sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];
        if (aValue === bValue) return 0;
        const aComparable = String(aValue ?? '');
        const bComparable = String(bValue ?? '');
        return aComparable > bComparable ? (ascending ? 1 : -1) : ascending ? -1 : 1;
      });
    }
    if (limitCount != null) {
      rows = rows.slice(0, limitCount);
    }
    return rows.map((row) => clone(row)) as RowsOf<T>;
  };

  const builder: SelectBuilder<T> = {
    eq(column, value) {
      filters.push((row) => row[column] === value);
      return builder;
    },
    order(column, options) {
      orderConfig = {column, ascending: options.ascending ?? true};
      return builder;
    },
    limit(count) {
      limitCount = count;
      return builder;
    },
    async single() {
      const rows = apply();
      const row = rows[0] ?? null;
      return row
        ? {data: row, error: null}
        : {data: null, error: {message: 'No rows'}};
    },
    async maybeSingle() {
      const rows = apply();
      const row = rows[0] ?? null;
      return {data: row, error: null};
    },
    async then(onfulfilled, onrejected) {
      try {
        const result = {data: apply(), error: null as null};
        return onfulfilled ? await onfulfilled(result) : (result as unknown as any);
      } catch (error) {
        if (onrejected) {
          return onrejected(error);
        }
        throw error;
      }
    },
    catch() {
      return builder;
    }
  };

  return builder;
}

function createModifyBuilder<T extends TableName>(
  table: T,
  store: TestStore,
  values: Partial<RowMap[T]>
): ModifyBuilder<T> {
  const filters: FilterFn<T>[] = [];

  const execute = (): RowsOf<T> => {
    const rows = getRows(table, store);
    const matches = rows.filter((row) => filters.every((fn) => fn(row)));
    matches.forEach((row) => {
      Object.assign(row, values);
    });
    return matches.map((row) => clone(row)) as RowsOf<T>;
  };

  const builder: ModifyBuilder<T> = {
    eq(column, value) {
      filters.push((row) => row[column] === value);
      return builder;
    },
    async then(onfulfilled, onrejected) {
      try {
        const result = {data: execute(), error: null as null};
        return onfulfilled ? await onfulfilled(result) : (result as unknown as any);
      } catch (error) {
        if (onrejected) {
          return onrejected(error);
        }
        throw error;
      }
    },
    catch() {
      return builder;
    }
  };

  return builder;
}

function tableApi<T extends TableName>(table: T, store: TestStore) {
  return {
    select: () => createSelectBuilder(table, store),
    insert: async (values: Partial<RowMap[T]> | Array<Partial<RowMap[T]>>) => {
      const items = Array.isArray(values) ? values : [values];
      const rows = getRows(table, store);
      const inserted = items.map((item) => {
        const record = {...(item as RowMap[T])};
        if (table === 'users' && !('is_admin' in record)) {
          (record as RowMap['users']).is_admin = false;
        }
        if (table === 'identities' && !('status' in record)) {
          (record as RowMap['identities']).status = 'submitted';
        }
        if (!record.id) {
          (record as RowMap[T] & {id: string}).id = generateId(table, store);
        }
        if (!('created_at' in record) || !record.created_at) {
          (record as RowMap[T] & {created_at: string}).created_at = new Date().toISOString();
        }
        rows.push(record);
        return clone(record) as RowMap[T];
      });
      return {data: inserted as RowsOf<T>, error: null};
    },
    upsert: async (values: Partial<RowMap[T]> | Array<Partial<RowMap[T]>>, options?: {onConflict?: keyof RowMap[T]}) => {
      const items = Array.isArray(values) ? values : [values];
      const rows = getRows(table, store);
      const updated: RowsOf<T> = [];
      const conflictKey = options?.onConflict;

      items.forEach((item) => {
        const incoming = {...(item as RowMap[T])};
        if (table === 'users' && !('is_admin' in incoming)) {
          (incoming as RowMap['users']).is_admin = false;
        }
        if (table === 'identities' && !('status' in incoming)) {
          (incoming as RowMap['identities']).status = 'submitted';
        }
        const key = conflictKey ? incoming[conflictKey] : undefined;
        if (conflictKey && key != null) {
          const existing = rows.find((row) => row[conflictKey] === key);
          if (existing) {
            Object.assign(existing, incoming);
            if (!existing.id) {
              (existing as RowMap[T] & {id: string}).id = generateId(table, store);
            }
            if (!('created_at' in existing) || !existing.created_at) {
              (existing as RowMap[T] & {created_at: string}).created_at = new Date().toISOString();
            }
            updated.push(clone(existing) as RowMap[T]);
            return;
          }
        }

        if (!incoming.id) {
          (incoming as RowMap[T] & {id: string}).id = generateId(table, store);
        }
        if (!('created_at' in incoming) || !incoming.created_at) {
          (incoming as RowMap[T] & {created_at: string}).created_at = new Date().toISOString();
        }
        rows.push(incoming);
        updated.push(clone(incoming) as RowMap[T]);
      });

      return {data: updated, error: null};
    },
    update: (values: Partial<RowMap[T]>) => createModifyBuilder(table, store, values)
  };
}

function resolveAuthUserFromCookieValue(store: TestStore, cookieValue?: string | null) {
  if (!cookieValue) {
    return store.authUser;
  }
  return cookieValue === 'none' ? null : store.authUser;
}

function resolveAuthUserFromDocument(store: TestStore) {
  if (typeof document === 'undefined') {
    return store.authUser;
  }
  const match = document.cookie.match(/(?:^|;)\s*test-auth=([^;]+)/);
  if (match && decodeURIComponent(match[1]) === 'none') {
    return null;
  }
  return store.authUser;
}

export function createTestServerClient(getTestAuthCookie?: () => string | undefined | null) {
  const store = getGlobalStore();
  const authCookie = getTestAuthCookie ? getTestAuthCookie() : undefined;
  const authUser = resolveAuthUserFromCookieValue(store, authCookie);

  return {
    auth: {
      async getUser() {
        return {data: {user: authUser ? clone(authUser) : null}, error: null};
      }
    },
    from<T extends TableName>(tableName: T) {
      return tableApi(tableName, store);
    }
  } as any;
}

export function createTestBrowserClient() {
  const store = getGlobalStore();
  const authUser = resolveAuthUserFromDocument(store);

  return {
    auth: {
      async getUser() {
        return {data: {user: authUser ? clone(authUser) : null}, error: null};
      }
    },
    from<T extends TableName>(tableName: T) {
      return tableApi(tableName, store);
    },
    storage: {
      from(_bucket: string) {
        return {
          async upload(filePath: string, _file: File | Blob, _options?: any) {
            return {data: {path: filePath}, error: null};
          },
          getPublicUrl(filePath: string) {
            return {data: {publicUrl: `https://storage.test/${filePath}`}};
          }
        };
      }
    }
  } as any;
}

export function createTestServiceClient() {
  return createTestServerClient();
}
