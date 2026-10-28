<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, type Problem } from '#lib/kb/problems';

  // `issues`: the engineering ticket filed for each problem, problem → { url, state }.
  type Issue = { url: string; state: string };
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, Issue>> } = $props();

  const rows = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const merged = $derived(uniqueById(rows));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
  const issueNo = (url: string) => `#${url.split('/').pop()}`;
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket}
  ({rows.length - merged.length} rows in the export are copies of another row) ·
  <strong>{groups.length}</strong> {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      {@const issue = issues[g.problem]}
      <tr>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong>{#if g.alsoIn.length}<br /><span class="small">also in {g.alsoIn.join(', ')}</span>{/if}</td>
        <td>{g.tenants.length}</td>
        <td class="small">{list(g.channels)}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issue}<a href={issue.url}>{issueNo(issue.url)}</a><br /><span class="state" class:open={issue.state === 'open'}>{issue.state}</span>
          {:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="small">
  Counted the desk's way: each report id once, under the cause its tenant files it in.
  {#each groups as g (g.problem)}<br /><code>{g.problem}</code>: {g.tenants.join(', ')}{/each}
</p>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .state { font-size: 0.85em; color: var(--muted); }
  .state.open, .none { color: var(--warn); font-weight: 600; }
</style>
