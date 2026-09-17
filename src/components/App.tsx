import { useState } from 'react';
import { LabShell } from './lab/LabShell';
import { Experiment } from './experiment/Experiment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function App() {
  const [tab, setTab] = useState(() => window.location.hash === '#experiment' ? 'experiment' : 'simulation');
  return <Tabs value={tab} onValueChange={value => {
    setTab(value);
    window.history.replaceState(null, '', value === 'experiment' ? '#experiment' : window.location.pathname + window.location.search);
  }}>
    <nav aria-label="Lab views" className="mx-auto max-w-7xl px-4 pt-5 md:px-6">
      <TabsList aria-label="Lab views">
        <TabsTrigger value="simulation">Simulation</TabsTrigger>
        <TabsTrigger value="experiment">Experiment</TabsTrigger>
      </TabsList>
    </nav>
    <TabsContent value="simulation"><LabShell /></TabsContent>
    <TabsContent value="experiment" forceMount hidden={tab !== 'experiment'}><Experiment active={tab === 'experiment'} /></TabsContent>
  </Tabs>;
}
