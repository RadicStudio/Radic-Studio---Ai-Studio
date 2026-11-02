import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";

import { CrudList } from "@/components/admin/CrudList";
import { TextAreaField, TextField } from "@/components/admin/Fields";
import type { Faq } from "@/lib/types";

export const Route = createFileRoute("/admin/faqs")({ component: Page });

type Row = Faq & Record<string, unknown>;

function Page() {
  return (
    <CrudList<Row>
      table="faqs"
      title="FAQ"
      text="Answers shown on the Services page and the quote page. Cost, timelines, payments, files and rights matter most to buyers."
      itemName="question"
      visibleKey="is_visible"
      defaults={{ question: "", answer: "", sort_order: 0, is_visible: true }}
      leading={() => (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-radic-red-tint text-radic-red">
          <HelpCircle className="h-4 w-4" />
        </div>
      )}
      render={(r) => (
        <>
          <p className="font-medium text-ink">{r.question}</p>
          <p className="line-clamp-1 text-xs text-graphite">{r.answer}</p>
        </>
      )}
      validate={(d) =>
        !d.question?.trim()
          ? "Question is required"
          : !d.answer?.trim()
            ? "Answer is required"
            : null
      }
      form={(d, set) => (
        <>
          <TextField label="Question" value={d.question} onChange={(v) => set({ question: v })} />
          <TextAreaField
            label="Answer"
            rows={5}
            value={d.answer}
            onChange={(v) => set({ answer: v })}
          />
        </>
      )}
    />
  );
}
