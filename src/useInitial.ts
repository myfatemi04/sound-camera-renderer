import { useRef } from 'react';

export default function useInitial<T>(value: T) {
	return useRef(value).current;
}
