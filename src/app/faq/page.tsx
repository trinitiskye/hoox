import PublicLayout from '@/components/layout/PublicLayout';
import FaqPage from '@/components/pages/FaqPage';
import { FAQ, plain } from '@/lib/faqContent';

export const metadata = {
  title: 'FAQ | HOOX',
  description: 'Answers about HOOX fishing tournaments, catch submissions and tournament codes, clubs, expos, advertising and your account.',
};

// FAQPage structured data so Google can show these answers in search results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.flatMap((s) => s.items).map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a.map(plain).join(' ') },
  })),
};

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <FaqPage />
    </PublicLayout>
  );
}
