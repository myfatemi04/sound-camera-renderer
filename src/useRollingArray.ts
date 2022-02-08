import { useCallback, useMemo, useRef, useState } from 'react';
import useInitial from './useInitial';

export default function useRollingArray<T>(length: number) {
	length = useInitial(length);
	const currentIndexRef = useRef(0);
	const [items, setItems] = useState<T[]>(() =>
		new Array(length).fill(undefined)
	);
	const addItem = useCallback(
		(item: T) => {
			setItems(items => {
				const newItems = [...items];
				newItems[currentIndexRef.current] = item;
				currentIndexRef.current = (currentIndexRef.current + 1) % length;
				return newItems;
			});
		},
		[length]
	);
	const unrolledItems = useMemo(() => {
		const unrolledItems = [];
		for (let i = 0; i < length; i++) {
			const item = items[(currentIndexRef.current + i) % length];
			if (item !== undefined) {
				unrolledItems.push(item);
			}
		}
		return unrolledItems;
	}, [items, length]);

	const value = useMemo(
		() => ({
			addItem,
			items: unrolledItems,
			// currentIndexRef changes whenever items changes
			currentIndex: currentIndexRef.current,
		}),
		[addItem, unrolledItems]
	);

	return value;
}
