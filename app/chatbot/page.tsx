import type { Metadata } from 'next';
import Chatbot from '@/components/chatbot';

export const metadata: Metadata = { title: 'Trợ lý Finsight' };

export default function ChatbotPage() {
  return <Chatbot />;
}
