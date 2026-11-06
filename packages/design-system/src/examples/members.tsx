"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  Input,
  Select,
  Table,
  type TableColumn,
  ToggleGroup,
  ToggleGroupItem,
} from "../index";

/**
 * A workspace members screen on sample data (ORV-37), composed by a builder agent from the public
 * entry only. All data is sample data: no invitation or email is sent and nothing is saved. The
 * screen changes its own state and nothing else.
 */
export type MemberRole = "owner" | "admin" | "designer" | "developer" | "reviewer" | "viewer";
export type MemberState = "active" | "invited";

export interface Member {
  id: string;
  name: string;
  email: string | undefined;
  role: MemberRole;
  state: MemberState;
  /** ISO date, year first, so a text sort is a date sort. */
  joined: string;
}

/** The rows start in neither date order nor name order, so a choice of order is seen to change them. */
export const MEMBERS: readonly Member[] = [
  {
    id: "m2",
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    role: "owner",
    state: "active",
    joined: "2025-06-02",
  },
  {
    id: "m3",
    name: "วรรณา ศรีสุวรรณพงศ์",
    email: "wanna.s@example.com",
    role: "designer",
    state: "active",
    joined: "2025-09-21",
  },
  {
    id: "m5",
    name: "Mia Tanaka",
    email: "mia.tanaka@example.com",
    role: "reviewer",
    state: "invited",
    joined: "2026-10-30",
  },
  {
    id: "m1",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    role: "admin",
    state: "active",
    joined: "2025-03-14",
  },
  {
    id: "m4",
    name: "ปัญญาวัฒน์เจริญสุขสมบูรณ์พูนผลศิริมงคลชัย",
    email: undefined,
    role: "developer",
    state: "active",
    joined: "2026-01-08",
  },
  {
    id: "m6",
    name: "กมลชนก แสงทอง",
    email: "kamonchanok@example.com",
    role: "viewer",
    state: "invited",
    joined: "2026-11-01",
  },
];

const TODAY = "2026-11-06";
/** The simulated moment an invitation is pending, in milliseconds. */
const LATENCY = 500;
const DEFAULT_ROLE: MemberRole = "viewer";

const ROLES: readonly { value: MemberRole; label: string }[] = [
  { value: "owner", label: "เจ้าของ" },
  { value: "admin", label: "ผู้ดูแล" },
  { value: "designer", label: "นักออกแบบ" },
  { value: "developer", label: "นักพัฒนา" },
  { value: "reviewer", label: "ผู้ตรวจงาน" },
  { value: "viewer", label: "ผู้ชม" },
];

const STATE_LABEL: Record<MemberState, string> = {
  active: "ใช้งานอยู่",
  invited: "รอตอบรับ",
};

type StateFilter = "all" | MemberState;

const STATE_CHOICES: readonly { value: StateFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "active", label: STATE_LABEL.active },
  { value: "invited", label: STATE_LABEL.invited },
];

const roleLabel = (role: MemberRole): string =>
  ROLES.find((entry) => entry.value === role)?.label ?? role;
const toRole = (value: string): MemberRole | undefined =>
  ROLES.find((entry) => entry.value === value)?.value;
const toFilter = (value: string): StateFilter | undefined =>
  STATE_CHOICES.find((entry) => entry.value === value)?.value;

/** The two orders a person can pick; no pick keeps the list as it came. */
type MemberOrder = "name" | "joined";

const ORDER_CHOICES: readonly { value: MemberOrder; label: string }[] = [
  { value: "name", label: "ชื่อ" },
  { value: "joined", label: "วันที่เข้าร่วม" },
];

const toOrder = (value: string): MemberOrder | undefined =>
  ORDER_CHOICES.find((entry) => entry.value === value)?.value;

const ordered = (rows: readonly Member[], order: MemberOrder | undefined): readonly Member[] => {
  if (order === "name") return [...rows].sort((a, b) => a.name.localeCompare(b.name, "th"));
  if (order === "joined") return [...rows].sort((a, b) => a.joined.localeCompare(b.joined));
  return rows;
};

function RowActions({
  member,
  anchor,
  onMakeAdmin,
  onRemove,
}: {
  member: Member;
  /** Hands the screen the element that holds this person's control, so focus can return to it. */
  anchor: (node: HTMLSpanElement | null) => void;
  onMakeAdmin: () => void;
  onRemove: () => void;
}) {
  const isAdmin = member.role === "admin" || member.role === "owner";
  return (
    <DropdownMenu>
      <span ref={anchor} className="inline-flex">
        <DropdownMenuTrigger>
          <Button variant="ghost" size="sm" aria-label={`จัดการ ${member.name}`}>
            จัดการ
          </Button>
        </DropdownMenuTrigger>
      </span>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={isAdmin} onSelect={onMakeAdmin}>
          ตั้งเป็นผู้ดูแล
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onRemove}>
          นำออก
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MembersScreen() {
  const formId = useId();
  const [members, setMembers] = useState<readonly Member[]>(MEMBERS);
  const [filter, setFilter] = useState<StateFilter>("all");
  const [order, setOrder] = useState<MemberOrder | undefined>(undefined);
  const [message, setMessage] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<MemberRole>(DEFAULT_ROLE);
  const [copy, setCopy] = useState(false);

  const [removing, setRemoving] = useState<Member | undefined>(undefined);
  const [removeOpen, setRemoveOpen] = useState(false);

  // Where keyboard focus goes when the confirmation closes: the person's own control, or the invite action.
  const controls = useRef(new Map<string, HTMLSpanElement>());
  const inviteAnchor = useRef<HTMLSpanElement>(null);
  const confirmed = useRef(false);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextId = useRef(1);
  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const active = members.filter((member) => member.state === "active").length;
  const invited = members.filter((member) => member.state === "invited").length;
  const visible = filter === "all" ? members : members.filter((member) => member.state === filter);

  const makeAdmin = (id: string) => {
    setMembers((rows) =>
      rows.map((row): Member => (row.id === id ? { ...row, role: "admin" } : row)),
    );
  };

  const askRemove = (member: Member) => {
    confirmed.current = false;
    setRemoving(member);
    setRemoveOpen(true);
  };

  const confirmRemove = () => {
    if (!removing) return;
    const gone = removing;
    confirmed.current = true;
    setMembers((rows) => rows.filter((row) => row.id !== gone.id));
    setMessage(`นำ ${gone.name} ออกแล้ว`);
    setRemoveOpen(false);
  };

  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email.includes("@")) {
      setEmailError("ใส่อีเมลก่อนเชิญ เช่น name@example.com");
      return;
    }
    setEmailError(undefined);
    setPending(true);
    const chosenRole = role;
    const sendCopy = copy;
    timer.current = setTimeout(() => {
      const id = `invited-${nextId.current}`;
      nextId.current += 1;
      setMembers((rows) => [
        { id, name: email, email, role: chosenRole, state: "invited", joined: TODAY },
        ...rows,
      ]);
      setFilter("all");
      setOrder(undefined);
      const sent = `เชิญ ${email} แล้ว เป็นข้อมูลตัวอย่าง ไม่ได้ส่งจริง`;
      setMessage(sendCopy ? `${sent} สำเนาก็ไม่ได้ส่งเช่นกัน` : sent);
      setPending(false);
      setInviteOpen(false);
    }, LATENCY);
  };

  const columns: readonly TableColumn<Member>[] = [
    {
      key: "name",
      header: "ชื่อ",
      cell: (row) => <span className="wrap-anywhere">{row.name}</span>,
    },
    {
      key: "email",
      header: "อีเมล",
      cell: (row) => (row.email ? <span className="wrap-anywhere">{row.email}</span> : undefined),
    },
    { key: "role", header: "บทบาท", cell: (row) => roleLabel(row.role) },
    {
      key: "state",
      header: "สถานะ",
      cell: (row) => (
        <Badge variant={row.state === "active" ? "success" : "neutral"}>
          {STATE_LABEL[row.state]}
        </Badge>
      ),
    },
    {
      key: "joined",
      header: "วันที่เข้าร่วม",
      numeric: true,
      cell: (row) => <time dateTime={row.joined}>{row.joined}</time>,
    },
    {
      key: "actions",
      header: "จัดการ",
      cell: (row) => (
        <RowActions
          member={row}
          anchor={(node) => {
            if (node) controls.current.set(row.id, node);
            else controls.current.delete(row.id);
          }}
          onMakeAdmin={() => makeAdmin(row.id)}
          onRemove={() => askRemove(row)}
        />
      ),
    },
  ];

  return (
    <div className="@container mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-display text-display-md text-balance">ทีมออกแบบ Brand Canvas</h1>
          <p className="max-w-prose text-body-md text-text-secondary">
            {`สมาชิก ${active} คน, รอตอบรับ ${invited} คน`}
          </p>
          <p className="text-body-sm text-text-secondary">
            ข้อมูลตัวอย่าง ไม่มีการบันทึกหรือส่งจริง
          </p>
        </div>
        <Dialog
          open={inviteOpen}
          onOpenChange={(next) => {
            if (pending) return;
            setInviteOpen(next);
            if (next) {
              setEmailError(undefined);
              setRole(DEFAULT_ROLE);
              setCopy(false);
            }
          }}
        >
          <span ref={inviteAnchor} className="inline-flex">
            <DialogTrigger>
              <Button variant="primary">เชิญสมาชิก</Button>
            </DialogTrigger>
          </span>
          <DialogContent
            title="เชิญสมาชิก"
            size="md"
            pending={pending}
            footer={
              <>
                <DialogClose>
                  <Button variant="ghost" disabled={pending}>
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button variant="primary" type="submit" form={formId} loading={pending}>
                  เชิญสมาชิก
                </Button>
              </>
            }
          >
            <form id={formId} className="flex flex-col gap-4" onSubmit={submitInvite} noValidate>
              <Field label="อีเมล" error={emailError} required>
                <Input name="email" type="email" autoComplete="off" disabled={pending} />
              </Field>
              <Field label="บทบาท">
                <Select
                  options={ROLES}
                  value={role}
                  onValueChange={(value) => {
                    const next = toRole(value);
                    if (next) setRole(next);
                  }}
                  disabled={pending}
                />
              </Field>
              <Checkbox
                label="ส่งสำเนาให้ฉันด้วย"
                checked={copy}
                onCheckedChange={(state) => setCopy(state === true)}
                disabled={pending}
              />
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          aria-label="สถานะ"
          value={filter}
          onValueChange={(value) => {
            const next = toFilter(value);
            if (next) setFilter(next);
          }}
        >
          {STATE_CHOICES.map((entry) => (
            <ToggleGroupItem key={entry.value} value={entry.value}>
              {entry.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          aria-label="เรียงตาม"
          value={order ?? ""}
          onValueChange={(value) => setOrder(toOrder(value))}
        >
          {ORDER_CHOICES.map((entry) => (
            <ToggleGroupItem key={entry.value} value={entry.value}>
              {entry.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Table
        caption="ทีมออกแบบ Brand Canvas"
        captionHidden
        columns={columns}
        rows={ordered(visible, order)}
        rowKey={(row) => row.id}
        missingLabel="ไม่มีข้อมูล"
      />

      <p role="status" className="min-h-6 text-body-sm text-text-secondary wrap-anywhere">
        {message}
      </p>

      <Dialog
        open={removeOpen}
        onOpenChange={(next) => {
          if (!next) setRemoveOpen(false);
        }}
      >
        <DialogContent
          variant="destructive"
          size="sm"
          title={`นำ ${removing?.name ?? ""} ออกจากเวิร์กสเปซ`}
          description={`${removing?.name ?? ""} จะเข้าเวิร์กสเปซนี้ไม่ได้อีก และต้องเชิญใหม่หากจะกลับมา`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const anchor = confirmed.current
              ? inviteAnchor.current
              : controls.current.get(removing?.id ?? "");
            anchor?.querySelector("button")?.focus();
          }}
          footer={
            <>
              <DialogClose>
                <Button variant="ghost">ยกเลิก</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmRemove}>
                นำออก
              </Button>
            </>
          }
        />
      </Dialog>
    </div>
  );
}
