import sqlite3 from "sqlite3";
import { promisify } from "util";

export class sqlite3Wrapper {
  #connection;
  #run;
  #get;

  constructor(dbName: string) {
    this.#connection = new sqlite3.Database(dbName);
    this.#run = promisify(this.#connection.run.bind(this.#connection));
    this.#get = promisify(this.#connection.get.bind(this.#connection));
  }

  async select(
    table: string,
    {
      values = ["*"],
      condition,
      sort,
      limit = 0,
      offset = 0,
    }: {
      values?: string[];
      condition?: string;
      sort?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<any> {
    const selectQuery =
      `SELECT ${values.join(", ")} FROM ${table}` + `${condition?.length ? " WHERE " + condition : ""}` + `${sort?.length ? " ORDER BY " + sort.join(", ") : ""}` + `${limit > 0 ? " LIMIT " + limit : ""}` + `${offset > 0 ? " OFFSET " + offset : ""}`;

    return await this.#get(selectQuery);
  }

  async insert(table: string, { fields, values, object, updateOnDuplicate = false }: { fields?: string[]; values?: any[]; object?: { [key: string]: any }; updateOnDuplicate?: boolean }): Promise<any> {
    let f = object ? Object.keys(object) : fields;
    let v = object ? Object.values(object) : values;

    if (!f || !v) throw new Error("Fields can't be empty");

    if (f.length !== v.length) throw new Error("Fields and values must be the same length");

    let str = "";
    let updateStr = "";

    for (let i = 0; i < v.length; i++) {
      updateStr += `${f[i]} = `;

      if (typeof v[i] === "string") {
        str += `"${v[i]}"`;
        updateStr += `"${v[i]}"`;
      } else {
        str += v[i];
        updateStr += v[i];
      }

      if (i < v.length - 1) {
        str += ", ";
        updateStr += ", ";
      }
    }

    return await this.#run(`INSERT INTO ${table} (${f.join(", ")}) VALUES (${str})${updateOnDuplicate ? " ON DUPLICATE KEY UPDATE " + updateStr : ""}`);
  }

  async update(
    table: string,
    {
      fields,
      values,
      object,
      condition,
    }: {
      fields?: string[];
      values?: any[];
      object?: { [key: string]: any };
      condition?: string;
    }
  ): Promise<any> {
    let f = object ? Object.keys(object) : fields;
    let v = object ? Object.values(object) : values;

    if (!f || !v) throw new Error("Fields can't be empty");

    if (f.length !== v.length) throw new Error("Fields and values must be the same length");

    let str = "";

    for (let i = 0; i < v.length; i++) {
      str += `${f[i]} = `;

      if (typeof v[i] === "string") {
        str += `"${v[i]}"`;
      } else {
        str += v[i];
      }

      if (i < v.length - 1) {
        str += ", ";
      }
    }

    return await this.#run(`UPDATE ${table} SET ${str} ${condition?.length ? "WHERE " + condition : ""}`);
  }

  async create(
    table: string,
    {
      fields,
      types,
      object,
      ifNotExists = true,
      engine = "INNODB",
    }: {
      fields?: string[];
      types?: string[];
      object?: { [key: string]: string };
      ifNotExists?: boolean;
      engine?: string;
    }
  ): Promise<any> {
    let f = object ? Object.keys(object) : fields;
    let v = object ? Object.values(object) : types;

    if (!f || !v) throw new Error("Fields can't be empty");

    if (f.length !== v.length) throw new Error("Fields and values must be the same length");

    let str = "";

    for (let i = 0; i < v.length; i++) {
      str += `${f[i]} ${v[i]}`;

      if (i < v.length - 1) {
        str += ", ";
      }
    }

    await this.#run(`CREATE TABLE${ifNotExists ? " IF NOT EXISTS" : ""} ${table} (${str}) ENGINE=${engine};`);
  }
}
