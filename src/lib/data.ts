import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

function readYaml<T = any>(name: string): T {
  return parse(fs.readFileSync(path.resolve(process.env.SITE_ROOT ?? '.', '_data', name), 'utf8')) as T;
}

export const metrics = readYaml<{
  works: number; citations: number; h_index: number; i10_index: number; openalex_url: string; updated: string;
}>('metrics.yml');

export const contact = readYaml<{ email: string }>('contact.yml');
export const socials = readYaml<Record<string, string | boolean>>('socials.yml');
export const cv = readYaml<any>('cv.yml');
type Person = { name: string; affiliations: string[]; orcid?: string; photo?: string };
export const people = readYaml<{ team: Person[]; collaborators: Person[] }>('people.yml');
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export const SITE = {
  name: 'Davestia Lab',
  author: 'David Setiadhi',
  tagline: 'Gas transport, sterilization and machine design, from model to measurement.',
  description:
    'Davestia Lab is run by David Setiadhi, a mechanical engineer working between simulation and the test bench. PhD candidate at Bursa Uludağ University and R&D Engineer at Mertay Makina.',
  orcid: '0000-0002-1765-1294',
};

/** Email split in two parts for the obfuscating script, never written whole into the HTML. */
export function emailParts(): [string, string] {
  const [u, d] = contact.email.split('@');
  return [Buffer.from(u).toString('base64'), Buffer.from(d).toString('base64')];
}

export const NAV = [
  { href: '/projects/', label: 'Research' },
  { href: '/publications/', label: 'Publications' },
  { href: '/tools/', label: 'Tools' },
  { href: '/news/', label: 'News' },
  { href: '/talks/', label: 'Talks' },
  { href: '/posts/', label: 'Blog' },
  { href: '/people/', label: 'People' },
  { href: '/cv/', label: 'CV' },
];

export function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }) {
  return d.toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}
