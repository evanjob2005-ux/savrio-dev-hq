import type { ConnectedService } from "@/types/domain";
import { Panel, Badge, StatusDot } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";
import { shortStampFromIso } from "@/lib/format";

const STATUS_COLOR: Record<ConnectedService["status"], string> = {
  connected: COLORS.ok,
  degraded: COLORS.warn,
  disconnected: COLORS.err,
  pending: COLORS.idle,
};

const KIND_LABEL: Record<ConnectedService["kind"], string> = {
  source_control: "Source control",
  orchestration: "Orchestration",
  database: "Database",
  monitoring: "Monitoring",
  ai_provider: "AI provider",
};

export function ConnectedServicesPanel({
  services,
}: {
  services: ConnectedService[];
}) {
  return (
    <Panel
      title="Connected Services"
      subtitle={`${services.length} integrations`}
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-[var(--border)]" role="list">
        {services.map((service) => (
          <li key={service.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[13px] font-medium text-[var(--text)]">{service.name}</h3>
                <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                  {KIND_LABEL[service.kind]}
                </p>
              </div>
              <Badge color={STATUS_COLOR[service.status]}>{service.status}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10.5px] text-[var(--text-dim)]">
              <StatusDot color={STATUS_COLOR[service.status]} size={6} />
              <span className="truncate font-mono">
                {service.endpoint ?? "Not configured"}
              </span>
              {service.lastSyncAt ? (
                <span className="ml-auto shrink-0 text-[var(--text-faint)]">
                  {shortStampFromIso(service.lastSyncAt)}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
