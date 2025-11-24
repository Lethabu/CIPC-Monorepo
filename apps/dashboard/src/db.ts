import { createEngine, Session, SQLModel, select } from 'sqlmodel';
import { User } from './models';

const sqliteFile = 'db.sqlite';
const sqliteUrl = `sqlite:///${sqliteFile}`;

const engine = createEngine(sqliteUrl, { echo: true });

export function createDbAndTables() {
  SQLModel.metadata.createAll(engine);
}

export function getSession() {
  return new Session(engine);
}
