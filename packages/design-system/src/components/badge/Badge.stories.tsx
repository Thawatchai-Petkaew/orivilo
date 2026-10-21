import type { Meta, StoryObj } from "@storybook/react-vite";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Badge, type BadgeVariant } from "./Badge";

/** The word carries the status; each is a state a real record can be in. */
const STATUS: readonly { variant: BadgeVariant; word: string }[] = [
  { variant: "neutral", word: "ฉบับร่าง" },
  { variant: "success", word: "อนุมัติแล้ว" },
  { variant: "warning", word: "ล้าสมัย" },
  { variant: "danger", word: "ล้มเหลว" },
  { variant: "info", word: "กำลังทำงาน" },
  { variant: "brand", word: "ORIVILO" },
];

const meta = {
  title: "Base/Badge",
  component: Badge,
  args: { children: "ฉบับร่าง" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS.map(({ variant, word }) => (
        <Badge key={variant} {...args} variant={variant}>
          {word}
        </Badge>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge {...args} size="sm" variant="success">
        อนุมัติแล้ว
      </Badge>
      <Badge {...args} size="md" variant="success">
        อนุมัติแล้ว
      </Badge>
      <Badge {...args} size="sm">
        {fixtures.latin}
      </Badge>
      <Badge {...args} size="md">
        {fixtures.latin}
      </Badge>
    </div>
  ),
};

/** Next to a title, the way the canvas and the version list use it. */
export const NextToATitle: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <h2 className="flex flex-wrap items-center gap-2 text-heading-sm">
        {fixtures.mixed}
        <Badge {...args} variant="success">
          อนุมัติแล้ว
        </Badge>
      </h2>
      <h2 className="flex flex-wrap items-center gap-2 text-heading-sm">
        <span className="min-w-0 truncate">{fixtures.longThai}</span>
        <Badge {...args} variant="warning">
          ล้าสมัย
        </Badge>
      </h2>
    </div>
  ),
};

/** A badge never renders without backing data; when the value is missing the line says so in text. */
export const MissingValue: Story = {
  render: () => (
    <p className="text-body-sm text-text-secondary">
      สถานะ: {fixtures.missing ?? fixtures.missingLabel}
    </p>
  ),
};

export const At360: Story = {
  render: (args) => (
    <Narrow>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS.map(({ variant, word }) => (
          <Badge key={variant} {...args} variant={variant}>
            {word}
          </Badge>
        ))}
      </div>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS.map(({ variant, word }) => (
          <Badge key={variant} {...args} variant={variant} size="sm">
            {word}
          </Badge>
        ))}
      </div>
    </Matrix>
  ),
};
