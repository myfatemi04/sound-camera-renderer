import { ReactNode } from 'react';

export default function Gate({
	children,
	active = false,
}: {
	children: ReactNode;
	active?: boolean;
}) {
	return active ? <>{children}</> : null;
}
