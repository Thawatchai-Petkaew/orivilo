import { describe, expect, it } from "vitest";
import { type FileLike, judgeFiles } from "./judge";
import { IMAGE_UPLOAD_LIMITS } from "./limits";

const file = (name: string, type: string, size: number): FileLike => ({ name, type, size });

/** Worked example W3: seven files, `used` 3, the limits of `upload-limits-1`. */
const W3 = [
  file("a.png", "image/png", 1_000_000),
  file("b.svg", "image/svg+xml", 1000),
  file("c.jpg", "image/jpeg", 4_000_001),
  file("d.webp", "image/webp", 4_000_000),
  file("e.PNG", "", 2000),
  file("f.gif", "image/gif", 5_000_000),
  file("g.jpeg", "image/jpeg", 1000),
];

describe("judgeFiles (upload-judge-1)", () => {
  it("gives the output of worked example W3", () => {
    const { accepted, rejected } = judgeFiles(W3, IMAGE_UPLOAD_LIMITS, 3);
    expect({
      a: accepted.map((f) => f.name),
      r: rejected.map((f) => [f.name, f.reason]),
    }).toEqual({
      a: ["a.png", "d.webp"],
      r: [
        ["b.svg", "type"],
        ["c.jpg", "size"],
        ["e.PNG", "count"],
        ["f.gif", "type"],
        ["g.jpeg", "count"],
      ],
    });
  });

  it("names each refused file with its size and reason", () => {
    const { rejected } = judgeFiles(W3, IMAGE_UPLOAD_LIMITS, 3);
    expect(rejected[1]).toEqual({ name: "c.jpg", size: 4_000_001, reason: "size" });
  });

  it("passes a file of exactly maxBytes and refuses one byte more", () => {
    const at = judgeFiles([file("at.png", "image/png", 4_000_000)], IMAGE_UPLOAD_LIMITS, 0);
    const over = judgeFiles([file("over.png", "image/png", 4_000_001)], IMAGE_UPLOAD_LIMITS, 0);
    expect(at.accepted).toHaveLength(1);
    expect(over.rejected.map((f) => f.reason)).toEqual(["size"]);
  });

  it("refuses an empty type whose extension is wrong, and takes one whose extension is right", () => {
    const { accepted, rejected } = judgeFiles(
      [file("photo.txt", "", 10), file("photo.WEBP", "", 10), file("noext", "", 10)],
      IMAGE_UPLOAD_LIMITS,
      0,
    );
    expect(accepted.map((f) => f.name)).toEqual(["photo.WEBP"]);
    expect(rejected.map((f) => [f.name, f.reason])).toEqual([
      ["photo.txt", "type"],
      ["noext", "type"],
    ]);
  });

  it("ignores the extension when the browser reports a type", () => {
    const { accepted, rejected } = judgeFiles(
      [file("photo.png", "text/plain", 10), file("photo.txt", "IMAGE/PNG", 10)],
      IMAGE_UPLOAD_LIMITS,
      0,
    );
    expect(accepted.map((f) => f.name)).toEqual(["photo.txt"]);
    expect(rejected.map((f) => f.name)).toEqual(["photo.png"]);
  });

  it("lets a refused file take no slot", () => {
    const files = [
      file("bad.svg", "image/svg+xml", 1),
      file("big.png", "image/png", 9_000_000),
      file("one.png", "image/png", 1),
      file("two.png", "image/png", 1),
    ];
    const { accepted } = judgeFiles(files, IMAGE_UPLOAD_LIMITS, 3);
    expect(accepted.map((f) => f.name)).toEqual(["one.png", "two.png"]);
  });

  it("refuses for count once used plus the accepted files reach maxFiles, and not before", () => {
    const four = judgeFiles([file("a.png", "image/png", 1)], IMAGE_UPLOAD_LIMITS, 4);
    const five = judgeFiles([file("a.png", "image/png", 1)], IMAGE_UPLOAD_LIMITS, 5);
    expect(four.accepted).toHaveLength(1);
    expect(five.rejected.map((f) => f.reason)).toEqual(["count"]);
  });

  it("walks the files in the order given", () => {
    const { accepted, rejected } = judgeFiles(
      [file("p6.png", "image/png", 1), file("p7.png", "image/png", 1)],
      IMAGE_UPLOAD_LIMITS,
      4,
    );
    expect(accepted.map((f) => f.name)).toEqual(["p6.png"]);
    expect(rejected.map((f) => f.name)).toEqual(["p7.png"]);
  });

  it("reports type before size: a gif over the size is refused for type", () => {
    const { rejected } = judgeFiles(
      [file("f.gif", "image/gif", 9_000_000)],
      IMAGE_UPLOAD_LIMITS,
      0,
    );
    expect(rejected.map((f) => f.reason)).toEqual(["type"]);
  });

  it("reports size before count: a big file at a full list is refused for size", () => {
    const { rejected } = judgeFiles(
      [file("big.png", "image/png", 9_000_000)],
      IMAGE_UPLOAD_LIMITS,
      5,
    );
    expect(rejected.map((f) => f.reason)).toEqual(["size"]);
  });

  it("returns nothing for no files", () => {
    expect(judgeFiles([], IMAGE_UPLOAD_LIMITS, 0)).toEqual({ accepted: [], rejected: [] });
  });
});
