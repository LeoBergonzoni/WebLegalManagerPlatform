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
};

type IdentityRow = {
  id: string;
  user_id: string;
  doc_type: string | null;
  doc_url: string | null;
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

type TestStore = {
  authUser: TestUser;
  tables: {
    users: UserRow[];
    identities: IdentityRow[];
    findings: FindingRow[];
    takedowns: TakedownRow[];
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
          stripe_subscription_id: null
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

type FilterFn = (row: any) => boolean;

type ModifyBuilder = {
  eq(column: string, value: any): ModifyBuilder;
  then<TResult = unknown>(
    onfulfilled?: ((value: {data: any[]; error: null}) => TResult | Promise<TResult>) | undefined | null,
    onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null
  ): Promise<TResult>;
  catch: (...args: any[]) => ModifyBuilder;
};

type SelectBuilder = {
  eq(column: string, value: any): SelectBuilder;
  order(column: string, options: {ascending?: boolean}): SelectBuilder;
  limit(count: number): SelectBuilder;
  single(): Promise<{data: any | null; error: {message: string} | null}>;
  maybeSingle(): Promise<{data: any | null; error: null}>;
  then<TResult = unknown>(
    onfulfilled?: ((value: {data: any[]; error: null}) => TResult | Promise<TResult>) | undefined | null,
    onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null
  ): Promise<TResult>;
  catch: (...args: any[]) => SelectBuilder;
};

function createSelectBuilder(
  table: TableName,
  store: TestStore,
  initialFilters: FilterFn[] = []
): SelectBuilder {
  let filters = [...initialFilters];
  let orderConfig: {column: string; ascending: boolean} | null = null;
  let limitCount: number | null = null;

  const apply = () => {
    let rows = store.tables[table];
    rows = rows.filter((row) => filters.every((fn) => fn(row)));
    if (orderConfig) {
      const {column, ascending} = orderConfig;
      rows = [...rows].sort((a, b) => {
        if (a[column] === b[column]) return 0;
        return a[column] > b[column] ? (ascending ? 1 : -1) : ascending ? -1 : 1;
      });
    }
    if (limitCount != null) {
      rows = rows.slice(0, limitCount);
    }
    return rows.map((row) => clone(row));
  };

  const builder: SelectBuilder = {
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
      const row = rows[0];
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

function createModifyBuilder(
  table: TableName,
  store: TestStore,
  values: Record<string, any>
): ModifyBuilder {
  let filters: FilterFn[] = [];

  const execute = () => {
    const rows = store.tables[table];
    const matches = rows.filter((row) => filters.every((fn) => fn(row)));
    matches.forEach((row) => {
      Object.assign(row, values);
    });
    return matches.map((row) => clone(row));
  };

  const builder: ModifyBuilder = {
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

function tableApi(table: TableName, store: TestStore) {
  return {
    select: () => createSelectBuilder(table, store),
    insert: async (values: any) => {
      const items = Array.isArray(values) ? values : [values];
      const inserted = items.map((item) => {
        const record = {...item};
        if (!record.id) {
          record.id = generateId(table, store);
        }
        if (!record.created_at) {
          record.created_at = new Date().toISOString();
        }
        store.tables[table].push(record);
        return clone(record);
      });
      return {data: inserted, error: null};
    },
    upsert: async (values: any, options?: {onConflict?: string}) => {
      const items = Array.isArray(values) ? values : [values];
      const updated: any[] = [];
      const conflictKey = options?.onConflict;
      items.forEach((item) => {
        if (conflictKey) {
          const existing = store.tables[table].find((row: any) => row[conflictKey] === item[conflictKey]);
          if (existing) {
            Object.assign(existing, item);
            if (!existing.id) {
              existing.id = generateId(table, store);
            }
            updated.push(clone(existing));
            return;
          }
        }
        const record = {...item};
        if (!record.id) {
          record.id = generateId(table, store);
        }
        if (!record.created_at) {
          record.created_at = new Date().toISOString();
        }
        store.tables[table].push(record);
        updated.push(clone(record));
      });
      return {data: updated, error: null};
    },
    update: (values: any) => createModifyBuilder(table, store, values)
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
    from(tableName: TableName) {
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
    from(tableName: TableName) {
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
