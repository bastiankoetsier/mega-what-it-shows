// The problems inside a merged ticket, counted the way the desk counts: by cause (causes.ts), each
// report where its tenant files it. The reports the desk read as a one-day move (desk-notes.json)
// are a problem of their own too: a month/day swap never moves a date by one day. They stay counted
// under their cause as well, so the rows can add up to more than the ticket.
import { groupByCause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'unplaced' | 'one-day-move';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // Set on one-day-move: the cause these reports are also counted under.
  alsoIn: Problem[];
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

function group(problem: Problem, rs: Report[], alsoIn: Problem[] = []): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: tally(rs.map((r) => r.channel)),
    taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    alsoIn,
  };
}

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const causes = groupByCause(reports, tenantOf);
  const groups = causes.map((g) => group(g.cause, g.reports));
  const moved = reports.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const alsoIn = causes.filter((g) => g.reports.some((r) => oneDayMove.includes(r.id))).map((g) => g.cause);
    groups.push(group('one-day-move', moved, alsoIn));
  }
  return groups;
}
