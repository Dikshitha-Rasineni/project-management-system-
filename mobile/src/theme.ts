/** Same tokens as the web app so both clients feel like one product. */
export const colors = {
  paper: '#F7F9FB',
  surface: '#FFFFFF',
  ink: '#1B2433',
  inkSoft: '#4A5568',
  inkMute: '#77839A',
  line: '#DDE3EA',
  lineStrong: '#C5CEDA',
  action: '#2952CC',
  actionPressed: '#1F43AD',
  actionTint: '#E8EEFC',
  pending: '#6B7A90',
  pendingTint: '#EEF1F5',
  progress: '#B7791F',
  progressBar: '#F2B544',
  progressTint: '#FDF4E1',
  done: '#23855A',
  doneBar: '#3BAA78',
  doneTint: '#E4F4EC',
  danger: '#C2412D',
  dangerTint: '#FCEBE7',
  white: '#FFFFFF',
};

export const radius = { box: 12, control: 10, pill: 999 };

export const space = (n: number) => n * 4;

export const type = {
  title: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4, color: colors.ink },
  heading: { fontSize: 17, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, color: colors.ink },
  small: { fontSize: 13, color: colors.inkSoft },
  tiny: { fontSize: 12, color: colors.inkMute },
};
