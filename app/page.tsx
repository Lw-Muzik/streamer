import React from 'react';
import type { Metadata } from "next";
import FoldersTab from '@/components/ContentTabs/FoldersTab';
import SongsTab from '@/components/ContentTabs/SongsTab';
import ContentTabsLayout from '@/components/ContentTabs/ContentTabsLayout';

import AppLayout from '@/components/Layout/AppLayout';

export const metadata: Metadata = {
  title: "Player | Ethereal Tunes",
  description: "Control what you want to listen to."
}
export default function Home() {

  return (
    <AppLayout>
      {/* Content Tabs */}
      <ContentTabsLayout>
        {/* Songs List */}
        <SongsTab />
        {/* Folders List */}
        <FoldersTab />
      </ContentTabsLayout>
    </AppLayout>
  );
}