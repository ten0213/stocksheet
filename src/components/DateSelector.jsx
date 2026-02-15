import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function DateSelector({ dates, selectedDate, onDateChange }) {
  return (
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel>날짜 선택</InputLabel>
      <Select
        value={selectedDate || ''}
        label="날짜 선택"
        onChange={(e) => onDateChange(e.target.value)}
      >
        {dates.map((date) => (
          <MenuItem key={date} value={date}>
            {date}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
