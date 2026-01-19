import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import FloatingAIButton from './FloatingAIButton';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title={title} />

        {/* Contenido de la página */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Botón flotante de IA */}
      <FloatingAIButton />
    </div>
  );
}
