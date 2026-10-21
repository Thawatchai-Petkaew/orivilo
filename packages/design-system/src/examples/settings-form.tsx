"use client";

import { useId } from "react";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
} from "../components/index";
import { fixtureOptions, fixtures } from "../components/fixtures";

/**
 * Base tier page example (E2-7): a settings form composed from the public components only.
 * Outside this package the import is `@orivilo/design-system`. Fixture content; nothing is saved.
 */
export interface SettingsFormProps {
  /** Messages from a failed save; each sits on its field and says how to fix it. */
  errors?: { name?: string | undefined; profile?: string | undefined } | undefined;
  /** The save is in flight: the primary shows loading and every control is disabled. */
  saving?: boolean | undefined;
}

function LinkGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <path d="M8.5 11.5a3.5 3.5 0 0 0 4.95 0l2.3-2.3a3.5 3.5 0 0 0-4.95-4.95L9.6 5.45" />
      <path d="M11.5 8.5a3.5 3.5 0 0 0-4.95 0l-2.3 2.3a3.5 3.5 0 0 0 4.95 4.95l1.2-1.2" />
    </svg>
  );
}

const SLUG = "brand-canvas-team";

export function SettingsForm({ errors, saving = false }: SettingsFormProps) {
  const formId = useId();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-md text-balance">ตั้งค่าเวิร์กสเปซ</h1>
        <p className="max-w-prose text-body-md text-text-secondary">
          ชื่อ ลิงก์ และ profile เริ่มต้นที่ทุกโปรเจกต์ในเวิร์กสเปซนี้ใช้
        </p>
      </header>

      <Tabs defaultValue="general">
        <TabsList aria-label="ส่วนของการตั้งค่า">
          <TabsTrigger value="general">ทั่วไป</TabsTrigger>
          <TabsTrigger value="members">สมาชิก</TabsTrigger>
          <TabsTrigger value="notifications">การแจ้งเตือน</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-6">
          <form
            id={formId}
            className="flex flex-col gap-6"
            onSubmit={(event) => event.preventDefault()}
          >
            <Field
              label="ชื่อเวิร์กสเปซ"
              description="ชื่อที่ทีมเห็นในทุกหน้า"
              error={errors?.name}
              required
            >
              <Input defaultValue={fixtures.mixed} disabled={saving} />
            </Field>

            <div className="flex flex-col gap-3">
              <Field label="ลิงก์" description="ใช้ตัวอักษรละติน ตัวเลข และขีดกลางเท่านั้น">
                <Input defaultValue={SLUG} disabled={saving} />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger>
                    <Button variant="ghost" size="sm" disabled={saving}>
                      ดูตัวอย่างลิงก์
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent aria-label="ตัวอย่างลิงก์">
                    <div className="flex w-72 max-w-full flex-col gap-3">
                      <p className="text-body-sm text-text-secondary">
                        ลิงก์ที่ทีมจะเห็นเมื่อแชร์เวิร์กสเปซนี้
                      </p>
                      <code className="font-mono text-code-md break-all">orivilo.app/w/{SLUG}</code>
                      <div className="flex justify-end">
                        <PopoverClose>
                          <Button variant="ghost" size="sm">
                            ปิด
                          </Button>
                        </PopoverClose>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Tooltip content="คัดลอกลิงก์">
                  <Button
                    iconOnly
                    aria-label="คัดลอกลิงก์"
                    variant="ghost"
                    size="sm"
                    disabled={saving}
                  >
                    <LinkGlyph />
                  </Button>
                </Tooltip>
              </div>
            </div>

            <Field label="คำอธิบาย" description="สั้นพอที่จะอ่านจบในหนึ่งนาที">
              <Textarea rows={3} defaultValue={fixtures.longThai} disabled={saving} />
            </Field>

            <Field
              label="Profile เริ่มต้น"
              description="โปรเจกต์ใหม่ในเวิร์กสเปซนี้เริ่มจาก profile นี้"
              error={errors?.profile}
              required
            >
              <Select options={fixtureOptions} placeholder="เลือก profile" disabled={saving} />
            </Field>

            <Checkbox
              label="ส่งสรุปรายสัปดาห์ให้ทุกคนในเวิร์กสเปซ"
              description="สรุปการตัดสินใจและโปรเจกต์ที่เปลี่ยนในสัปดาห์นั้น"
              defaultChecked
              disabled={saving}
            />
          </form>
        </TabsContent>

        <TabsContent value="members" className="pt-6">
          <p className="text-body-md text-text-secondary">{fixtures.missingLabel}</p>
        </TabsContent>
        <TabsContent value="notifications" className="pt-6">
          <p className="text-body-md text-text-secondary">{fixtures.missingLabel}</p>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" disabled={saving}>
          ยกเลิก
        </Button>
        <Button
          variant="primary"
          type="submit"
          form={formId}
          loading={saving}
          loadingLabel="กำลังบันทึก"
        >
          บันทึกการเปลี่ยนแปลง
        </Button>
      </div>
    </div>
  );
}
