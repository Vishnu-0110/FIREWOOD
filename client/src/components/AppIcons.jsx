const IconShell = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const MenuIcon = () => (
  <IconShell>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </IconShell>
);

export const CloseIcon = () => (
  <IconShell>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </IconShell>
);

export const MoonIcon = () => (
  <IconShell>
    <path d="M20 14.6A7.8 7.8 0 0 1 9.4 4a8 8 0 1 0 10.6 10.6Z" />
  </IconShell>
);

export const SunIcon = () => (
  <IconShell>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2.8v2.1" />
    <path d="M12 19.1v2.1" />
    <path d="M4.9 4.9l1.5 1.5" />
    <path d="M17.6 17.6l1.5 1.5" />
    <path d="M2.8 12h2.1" />
    <path d="M19.1 12h2.1" />
    <path d="M4.9 19.1l1.5-1.5" />
    <path d="M17.6 6.4l1.5-1.5" />
  </IconShell>
);

export const PowerIcon = () => (
  <IconShell>
    <path d="M12 3.3v7.1" />
    <path d="M7.4 5.4a8 8 0 1 0 9.2 0" />
  </IconShell>
);

export const EyeIcon = () => (
  <IconShell>
    <path d="M2.5 12s3.3-6.5 9.5-6.5S21.5 12 21.5 12s-3.3 6.5-9.5 6.5S2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </IconShell>
);

export const EyeOffIcon = () => (
  <IconShell>
    <path d="M3.5 4.5l17 15" />
    <path d="M6.3 7A12.1 12.1 0 0 0 2.5 12s3.3 6.5 9.5 6.5c1.1 0 2.1-.1 3-.4" />
    <path d="M10.1 5.4A10.7 10.7 0 0 1 12 5.5C18.2 5.5 21.5 12 21.5 12a13.9 13.9 0 0 1-2 3.1" />
    <circle cx="12" cy="12" r="2.5" />
  </IconShell>
);

export const DownloadIcon = () => (
  <IconShell>
    <path d="M12 4v10" />
    <path d="M8.2 10.6 12 14.4l3.8-3.8" />
    <path d="M5 19h14" />
  </IconShell>
);

export const PrintIcon = () => (
  <IconShell>
    <path d="M7 8V4h10v4" />
    <path d="M7 17h10v3H7z" />
    <path d="M6 9h12a2 2 0 0 1 2 2v4H18" />
    <path d="M6 15H4v-4a2 2 0 0 1 2-2h12" />
  </IconShell>
);

export const ShareIcon = () => (
  <IconShell>
    <circle cx="18" cy="5" r="2" />
    <circle cx="6" cy="12" r="2" />
    <circle cx="18" cy="19" r="2" />
    <path d="M7.8 11.1 16.2 6.9" />
    <path d="M7.8 12.9 16.2 17.1" />
  </IconShell>
);

export const PlusIcon = () => (
  <IconShell>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconShell>
);

export const SearchIcon = () => (
  <IconShell>
    <circle cx="11" cy="11" r="5.5" />
    <path d="M15.2 15.2 20 20" />
  </IconShell>
);

export const FilterIcon = () => (
  <IconShell>
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </IconShell>
);

export const EditIcon = () => (
  <IconShell>
    <path d="M4.8 19.2 8 18.6l9.7-9.7a1.7 1.7 0 0 0 0-2.4l-.2-.2a1.7 1.7 0 0 0-2.4 0L5.4 15.7l-.6 3.5Z" />
    <path d="M14.6 5.4 18.6 9.4" />
  </IconShell>
);

export const TrashIcon = () => (
  <IconShell>
    <path d="M5 7h14" />
    <path d="M10 4h4" />
    <path d="M8 7l.7 13h6.6L16 7" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </IconShell>
);

export const LeftIcon = () => (
  <IconShell>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </IconShell>
);

export const RightIcon = () => (
  <IconShell>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </IconShell>
);

export const CheckIcon = () => (
  <IconShell>
    <path d="M5.5 12.5 10 17l8.5-10" />
  </IconShell>
);

export const TemplateIcon = () => (
  <IconShell>
    <path d="M7 3.5h7l4 4V20.5H7z" />
    <path d="M14 3.5v4h4" />
    <path d="M9 11h6" />
    <path d="M9 15h6" />
  </IconShell>
);

export const IconAction = ({ as: Component = 'button', icon: Icon, label, className = '', children, ...props }) => {
  const resolvedClassName = ['btn', 'btn-icon', className].filter(Boolean).join(' ');

  return (
    <Component className={resolvedClassName} aria-label={label} title={label} {...props}>
      {Icon ? <Icon /> : null}
      <span className="visually-hidden">{label}</span>
      {children}
    </Component>
  );
};
