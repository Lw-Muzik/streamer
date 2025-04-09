"use client"
import React from 'react';
import FoldersTab from '@/components/ContentTabs/FoldersTab';
import SongsTab from '@/components/ContentTabs/SongsTab';
import ContentTabsLayout from '@/components/ContentTabs/ContentTabsLayout';

import AppLayout from '@/components/Layout/AppLayout';

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