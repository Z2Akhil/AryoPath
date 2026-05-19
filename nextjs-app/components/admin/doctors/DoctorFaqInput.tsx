'use client';

import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { DoctorFormValues } from '@/types/doctor';

export default function DoctorFaqInput() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<DoctorFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'faqs' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqErrors = (errors.faqs as any) ?? [];

  const addFaq = () => {
    append({ question: '', answer: '' });
    setOpenIndex(fields.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Frequently Asked Questions
        </p>
        <button
          type="button"
          onClick={addFaq}
          className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add FAQ
        </button>
      </div>

      {fields.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-400">No FAQs yet. Add your first one!</p>
        </div>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => {
          const isOpen = openIndex === index;
          const qError = faqErrors[index]?.question?.message;
          const aError = faqErrors[index]?.answer?.message;

          return (
            <div
              key={field.id}
              className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {field.question || (
                    <span className="text-gray-400 italic">Untitled Question</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                      if (openIndex === index) setOpenIndex(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Question
                    </label>
                    <input
                      {...register(`faqs.${index}.question`)}
                      placeholder="e.g. How long is a consultation session?"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                    />
                    {qError && <p className="text-xs text-red-500 mt-1">{qError}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Answer
                    </label>
                    <textarea
                      {...register(`faqs.${index}.answer`)}
                      rows={3}
                      placeholder="Provide a clear, concise answer..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all resize-none"
                    />
                    {aError && <p className="text-xs text-red-500 mt-1">{aError}</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
