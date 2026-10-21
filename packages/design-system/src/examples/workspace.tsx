"use client";

import { type FormEvent, useId, useState } from "react";
import {
  Badge,
  type BadgeVariant,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Field,
  Input,
  Select,
  Table,
  type TableColumn,
  Textarea,
} from "../components/index";
import { fixtures } from "../components/fixtures";

/**
 * The reference screen (handoff §19, E2-8): a team workspace with project creation, composed from
 * the public components only. The app renders it at /workspace through the package's `examples`
 * entry; Storybook proves it with long data, at 360 px, with a load error and under both profiles.
 * Fixture data: the screen says so, counts come from its rows, and nothing is saved.
 */
export type ProjectModule = "discover" | "brand" | "design-system" | "product";
export type ProjectStatus = "draft" | "review" | "approved";

export interface Project {
  id: string;
  name: string;
  module: ProjectModule;
  owner: string | undefined;
  status: ProjectStatus;
  updated: string;
}

export interface WorkspaceScreenProps {
  projects?: readonly Project[] | undefined;
  members?: number | undefined;
  loading?: boolean | undefined;
  /** What went wrong loading the projects and how to fix it; shown as the Table's error row. */
  loadError?: string | undefined;
  /** Simulated latency of create and archive, so pending shows. */
  latency?: number | undefined;
}

export const PROJECTS: readonly Project[] = [
  {
    id: "p1",
    name: fixtures.mixed,
    module: "brand",
    owner: "วรรณา",
    status: "review",
    updated: "2026-10-21",
  },
  {
    id: "p2",
    name: fixtures.longThai,
    module: "discover",
    owner: "Priya N.",
    status: "draft",
    updated: "2026-10-20",
  },
  {
    id: "p3",
    name: "Design system ของ Orbit Mobility",
    module: "design-system",
    owner: fixtures.missing,
    status: "approved",
    updated: "2026-10-17",
  },
  {
    id: "p4",
    name: fixtures.longLatin,
    module: "product",
    owner: "กมล",
    status: "draft",
    updated: "2026-10-12",
  },
  {
    id: "p5",
    name: "หน้า onboarding ของแอปธนาคาร",
    module: "product",
    owner: "Mia",
    status: "review",
    updated: "2026-09-30",
  },
  {
    id: "p6",
    name: "Brand pack ของร้านกาแฟ Lumen",
    module: "brand",
    owner: "วรรณา",
    status: "approved",
    updated: "2026-09-02",
  },
];

const MODULE_LABEL: Record<ProjectModule, string> = {
  discover: "Discover",
  brand: "Brand",
  "design-system": "Design System",
  product: "Product",
};
const MODULE_OPTIONS = (Object.keys(MODULE_LABEL) as ProjectModule[]).map((value) => ({
  value,
  label: MODULE_LABEL[value],
}));
const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "ฉบับร่าง",
  review: "รอรีวิว",
  approved: "อนุมัติแล้ว",
};
const STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  draft: "neutral",
  review: "warning",
  approved: "success",
};

const columns: readonly TableColumn<Project>[] = [
  { key: "name", header: "โปรเจกต์", sortable: true },
  {
    key: "module",
    header: "โมดูล",
    width: "9rem",
    cell: (row) => <Badge>{MODULE_LABEL[row.module]}</Badge>,
  },
  { key: "owner", header: "เจ้าของ", sortable: true, width: "9rem" },
  {
    key: "status",
    header: "สถานะ",
    cell: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
  },
  { key: "updated", header: "แก้ไขล่าสุด", numeric: true, sortable: true },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function CreateProjectDialog({
  existing,
  latency,
  onCreate,
}: {
  existing: readonly Project[];
  latency: number;
  onCreate: (project: Project) => void;
}) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const reset = () => {
    setNameError(undefined);
    setError(undefined);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const module = String(data.get("module") ?? "brand") as ProjectModule;
    if (!name) {
      setNameError("ใส่ชื่อโปรเจกต์ก่อนสร้าง");
      return;
    }
    setNameError(undefined);
    setPending(true);
    await wait(latency);
    if (existing.some((p) => p.name === name)) {
      setPending(false);
      setError("สร้างไม่สำเร็จ เพราะมีโปรเจกต์ชื่อนี้อยู่แล้ว ลองใช้ชื่ออื่น");
      return;
    }
    onCreate({
      id: `new-${Date.now()}`,
      name,
      module,
      owner: "คุณ",
      status: "draft",
      updated: new Date().toISOString().slice(0, 10),
    });
    setPending(false);
    setError(undefined);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger>
        <Button variant="primary">สร้างโปรเจกต์</Button>
      </DialogTrigger>
      <DialogContent
        title="สร้างโปรเจกต์"
        description="โปรเจกต์ใหม่เริ่มจาก profile ของเวิร์กสเปซ และเปลี่ยนได้ทีหลัง"
        pending={pending}
        error={error}
        footer={
          <>
            <DialogClose>
              <Button variant="ghost" disabled={pending}>
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              type="submit"
              form={formId}
              loading={pending}
              loadingLabel="กำลังสร้าง"
            >
              สร้าง
            </Button>
          </>
        }
      >
        <form id={formId} className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <Field label="ชื่อโปรเจกต์" error={nameError} required>
            <Input name="name" placeholder="เช่น Brand Canvas ของทีม" disabled={pending} />
          </Field>
          <Field label="โมดูล" description="จุดที่โปรเจกต์นี้เริ่ม" required>
            <Select
              name="module"
              options={MODULE_OPTIONS}
              defaultValue="brand"
              disabled={pending}
            />
          </Field>
          <Field label="บรีฟสั้น ๆ" description="เขียนได้ทีหลัง">
            <Textarea name="brief" rows={3} disabled={pending} />
          </Field>
          <Checkbox
            name="inherit"
            label="ใช้ profile ของเวิร์กสเปซ"
            description="ถ้าไม่ติ๊ก โปรเจกต์เริ่มจาก profile neutral"
            defaultChecked
            disabled={pending}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveDialog({
  count,
  latency,
  onArchive,
}: {
  count: number;
  latency: number;
  onArchive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const confirm = async () => {
    setPending(true);
    await wait(latency);
    onArchive();
    setPending(false);
    setOpen(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <DialogTrigger>
        <Button variant="ghost" size="sm">
          เก็บถาวร
        </Button>
      </DialogTrigger>
      <DialogContent
        variant="destructive"
        size="sm"
        title={`เก็บถาวร ${count} โปรเจกต์`}
        description="โปรเจกต์ที่เก็บถาวรจะหายจากรายการนี้ และสมาชิกจะเปิดไม่ได้จนกว่าจะกู้คืน"
        pending={pending}
        footer={
          <>
            <DialogClose>
              <Button variant="ghost" disabled={pending}>
                เก็บไว้
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              loading={pending}
              loadingLabel="กำลังเก็บถาวร"
              onClick={() => void confirm()}
            >
              เก็บถาวร
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

export function WorkspaceScreen({
  projects: initial = PROJECTS,
  members = 4,
  loading = false,
  loadError,
  latency = 600,
}: WorkspaceScreenProps) {
  const [projects, setProjects] = useState<readonly Project[]>(initial);
  const [error, setError] = useState<string | undefined>(loadError);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");

  const archive = () => {
    setProjects((rows) => rows.filter((row) => !selected.has(row.id)));
    setAnnouncement(`เก็บถาวร ${selected.size} โปรเจกต์แล้ว`);
    setSelected(new Set());
  };

  return (
    <div className="@container mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display-md text-balance">ทีมออกแบบ Brand Canvas</h1>
          <p className="max-w-prose text-body-md text-text-secondary">
            {projects.length} โปรเจกต์, สมาชิก {members} คน
          </p>
          <p className="flex flex-wrap items-center gap-2 text-body-sm text-text-secondary">
            <Badge size="sm">ข้อมูลตัวอย่าง</Badge>
            สิ่งที่สร้างหรือเก็บถาวรในหน้านี้ยังไม่ได้บันทึกจริง
          </p>
        </div>
        <CreateProjectDialog
          existing={projects}
          latency={latency}
          onCreate={(project) => {
            setProjects((rows) => [project, ...rows]);
            setAnnouncement(`สร้างโปรเจกต์ ${project.name} แล้ว`);
          }}
        />
      </header>

      <div className="flex min-h-9 flex-wrap items-center gap-3" aria-live="polite">
        {selected.size > 0 ? (
          <>
            <span className="text-body-sm text-text-secondary">
              เลือกอยู่ {selected.size} โปรเจกต์
            </span>
            <ArchiveDialog count={selected.size} latency={latency} onArchive={archive} />
          </>
        ) : null}
      </div>

      <Table
        caption="โปรเจกต์ในเวิร์กสเปซ"
        columns={columns}
        rows={projects}
        rowKey={(row) => row.id}
        rowLabel={(row) => `เลือก ${row.name}`}
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        loading={loading}
        error={
          error
            ? {
                message: error,
                action: (
                  <Button variant="secondary" size="sm" onClick={() => setError(undefined)}>
                    ลองอีกครั้ง
                  </Button>
                ),
              }
            : undefined
        }
        empty={{
          title: "ยังไม่มีโปรเจกต์",
          description: "สร้างโปรเจกต์แรกจากบรีฟหรือจากแบรนด์ที่มีอยู่",
        }}
      />

      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
