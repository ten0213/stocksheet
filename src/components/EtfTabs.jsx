import { Tabs, Tab, Box } from '@mui/material';

export default function EtfTabs({ etfNames, selectedEtf, onEtfChange }) {
  if (!etfNames || etfNames.length === 0) return null;

  const currentIndex = etfNames.indexOf(selectedEtf);

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(_, newIndex) => onEtfChange(etfNames[newIndex])}
        variant="scrollable"
        scrollButtons="auto"
      >
        {etfNames.map((name) => (
          <Tab key={name} label={name} />
        ))}
      </Tabs>
    </Box>
  );
}
