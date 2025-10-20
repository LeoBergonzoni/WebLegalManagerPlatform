'use client';

import {PieChart, Pie, Cell, ResponsiveContainer, Tooltip} from 'recharts';
import type {ValueType, NameType} from 'recharts/types/component/DefaultTooltipContent';
import {useAppTranslations} from './TranslationsProvider';

type MetricsSectionProps = {
  stats: {
    removed: number;
    delisted: number;
    total: number;
  };
};

const SLICE_COLORS = ['#34d399', '#f97316'];

export default function MetricsSection({stats}: MetricsSectionProps) {
  const t = useAppTranslations();
  const totalForChart = (stats.removed ?? 0) + (stats.delisted ?? 0);
  const chartData =
    totalForChart > 0
      ? [
          {name: t('app.metrics.removedLabel'), value: stats.removed},
          {name: t('app.metrics.delistedLabel'), value: stats.delisted}
        ]
      : [];

  const renderLabel = (entry: {name: string; value: number}) => {
    if (totalForChart === 0) return entry.name;
    const percentage = ((entry.value / totalForChart) * 100).toFixed(1);
    return `${entry.name}: ${percentage}%`;
  };

  return (
    <section className="mt-10 space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-white/70">{t('app.metrics.totalRemovedTitle')}</p>
        <p className="mt-2 text-3xl font-semibold">{stats.removed}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--wlm-text)]">{t('app.metrics.removalMetricsTitle')}</h2>
          <span className="text-xs uppercase tracking-[0.14em] text-white/60">
            {t('app.metrics.totalCount').replace('{count}', String(stats.total))}
          </span>
        </div>

        {stats.total === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/10 py-16 text-center text-sm text-white/60">
            {t('app.metrics.emptyState')}
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={renderLabel}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: ValueType, name: NameType) => {
                    const v = Number(val ?? 0);
                    const percentage = totalForChart === 0 ? 0 : (v / totalForChart) * 100;
                    return [`${v} (${percentage.toFixed(1)}%)`, name] as [React.ReactNode, NameType];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
