"use client";

import { useId, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  CardValue,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Field,
  Input,
  Select,
  Table,
  type TableColumn,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "../components/index";
import { fixtures } from "../components/fixtures";

/**
 * Application tier page example (E2-7): the airy bento of DESIGN.md §2 over a Table, with the
 * new-decision Dialog opened from the page's one primary action. Composed from the public
 * components only (`@orivilo/design-system` from outside this package). Fixture content; the
 * metric cards are computed from the rows shown, never typed in.
 */
export interface Decision {
  id: string;
  title: string;
  /** The canvas node the decision came from. */
  source: string;
  status: "review" | "approved";
  reason: string | undefined;
  decided: string;
}

export type DecisionFilter = "all" | "review" | "approved";

export interface DecisionLogProps {
  rows?: readonly Decision[] | undefined;
  defaultFilter?: DecisionFilter | undefined;
  loading?: boolean | undefined;
  /** What went wrong and how to fix it; shown as the Table's error row. */
  error?: string | undefined;
  /** Opens the new-decision dialog on first render. */
  dialogOpen?: boolean | undefined;
}

/** Thai, Latin, a long Thai name without spaces, and a missing reason (DESIGN.md §4). */
export const DECISIONS: readonly Decision[] = [
  {
    id: "d1",
    title: "ใช้ Orbit violet เป็นสีของการกระทำหลัก",
    source: "Color",
    status: "approved",
    reason: "บอร์ด 06 ของกรณีศึกษาแบรนด์กำหนดไว้ และผ่าน 4.5 บนพื้นขาว",
    decided: "2026-10-21",
  },
  {
    id: "d2",
    title: fixtures.longThai,
    source: "Brand",
    status: "review",
    reason: "รอผลการทดสอบ lineup กับคนนอกสามคน",
    decided: "2026-10-20",
  },
  {
    id: "d3",
    title: "Anuphan คู่กับ IBM Plex Sans บนบรรทัดเดียวกัน",
    source: "Type",
    status: "approved",
    reason: "ตัวไทยไม่เล็กกว่าตัวละตินที่ขนาดเดียวกัน ตามผลการวัดใน specimen",
    decided: "2026-10-19",
  },
  {
    id: "d4",
    title: fixtures.longLatin,
    source: "Layout",
    status: "review",
    reason: fixtures.missing,
    decided: "2026-10-18",
  },
  {
    id: "d5",
    title: "รัศมี 12, 16 และ 24 สำหรับ control, container และ overlay",
    source: "Shape",
    status: "approved",
    reason: "mood E ของเจ้าของ: pill control และกล่องมุมมน",
    decided: "2026-10-17",
  },
];

const STATUS_LABEL: Record<Decision["status"], string> = {
  review: "รอรีวิว",
  approved: "อนุมัติแล้ว",
};
const STATUS_VARIANT = { review: "warning", approved: "success" } as const;

const FILTERS: readonly { value: DecisionFilter; label: string; caption: string }[] = [
  { value: "all", label: "ทั้งหมด", caption: "การตัดสินใจทั้งหมด" },
  { value: "review", label: "รอรีวิว", caption: "การตัดสินใจที่รอรีวิว" },
  { value: "approved", label: "อนุมัติแล้ว", caption: "การตัดสินใจที่อนุมัติแล้ว" },
];

const SOURCES = [
  { value: "brand", label: "Brand" },
  { value: "color", label: "Color" },
  { value: "type", label: "Type" },
  { value: "layout", label: "Layout" },
  { value: "shape", label: "Shape" },
];

const columns: readonly TableColumn<Decision>[] = [
  { key: "title", header: "การตัดสินใจ", sortable: true },
  { key: "source", header: "แหล่งที่มา", sortable: true },
  {
    key: "status",
    header: "สถานะ",
    cell: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
  },
  { key: "reason", header: "เหตุผล", truncate: true, width: "18rem" },
  { key: "decided", header: "เมื่อ", numeric: true, sortable: true },
];

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <Card as="article">
      <CardTitle as="h2">{title}</CardTitle>
      <CardValue>{value}</CardValue>
      <p className="text-text-secondary">{note}</p>
    </Card>
  );
}

function NewDecisionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button variant="primary">บันทึกการตัดสินใจใหม่</Button>
      </DialogTrigger>
      <DialogContent
        title="บันทึกการตัดสินใจใหม่"
        description="การตัดสินใจทุกรายการต้องบอกแหล่งที่มาและเหตุผล จึงจะสืบย้อนได้"
        footer={
          <>
            <DialogClose>
              <Button variant="ghost">ยกเลิก</Button>
            </DialogClose>
            <Button variant="primary" type="submit" form={formId}>
              บันทึก
            </Button>
          </>
        }
      >
        <form
          id={formId}
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onOpenChange(false);
          }}
        >
          <Field label="การตัดสินใจ" required>
            <Input placeholder="เช่น ใช้สีม่วงเป็นสีของการกระทำหลัก" />
          </Field>
          <Field label="แหล่งที่มา" description="node บน canvas ที่การตัดสินใจนี้มาจาก" required>
            <Select options={SOURCES} placeholder="เลือก node" />
          </Field>
          <Field label="เหตุผล" description="สิ่งที่คนอ่านทีหลังต้องรู้เพื่อเข้าใจว่าทำไม">
            <Textarea rows={3} />
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DecisionLog({
  rows = DECISIONS,
  defaultFilter = "all",
  loading = false,
  error,
  dialogOpen = false,
}: DecisionLogProps) {
  const [filter, setFilter] = useState<DecisionFilter>(defaultFilter);
  const [open, setOpen] = useState(dialogOpen);
  const withReason = rows.filter((row) => row.reason !== undefined).length;
  const review = rows.filter((row) => row.status === "review").length;
  const share = rows.length === 0 ? "0%" : `${Math.round((withReason / rows.length) * 100)}%`;

  return (
    <div className="@container mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display-md text-balance">บันทึกการตัดสินใจ</h1>
          <p className="max-w-prose text-body-md text-text-secondary">
            ทุกการตัดสินใจใน {fixtures.mixed} พร้อมแหล่งที่มาและเหตุผล
          </p>
        </div>
        <NewDecisionDialog open={open} onOpenChange={setOpen} />
      </header>

      <div className="grid gap-4 @2xl:grid-cols-3">
        <Metric title="ทั้งหมด" value={String(rows.length)} note="รายการในโปรเจกต์นี้" />
        <Metric
          title="มีเหตุผลกำกับ"
          value={share}
          note={`${withReason} จาก ${rows.length} รายการ`}
        />
        <Metric title="รอรีวิว" value={String(review)} note="รอเจ้าของโปรเจกต์ตัดสิน" />
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as DecisionFilter)}>
        <TabsList aria-label="กรองตามสถานะ">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {FILTERS.map((f) => (
          <TabsContent key={f.value} value={f.value} className="pt-4">
            <Table
              caption={f.caption}
              columns={columns}
              rows={f.value === "all" ? rows : rows.filter((row) => row.status === f.value)}
              rowKey={(row) => row.id}
              loading={loading}
              error={
                error
                  ? {
                      message: error,
                      action: (
                        <Button variant="secondary" size="sm">
                          ลองอีกครั้ง
                        </Button>
                      ),
                    }
                  : undefined
              }
              empty={{
                title: "ยังไม่มีการตัดสินใจในมุมมองนี้",
                description: "บันทึกการตัดสินใจแรกพร้อมแหล่งที่มาและเหตุผล",
                action: (
                  <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                    บันทึกการตัดสินใจใหม่
                  </Button>
                ),
              }}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
