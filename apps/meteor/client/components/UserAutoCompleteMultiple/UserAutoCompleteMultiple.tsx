import { AutoComplete, Box, Option, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { ComponentProps, memo, ReactElement, useCallback, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term }) });

type UserAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter' | 'onChange'> &
	Omit<ComponentProps<typeof Option>, 'value' | 'is' | 'className' | 'onChange'> & {
		onChange: (value: any, action: 'remove' | undefined) => void;
		value: any;
		filter?: string;
	};

const UserAutoCompleteMultiple = ({ onChange, ...props }: UserAutoCompleteMultipleProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData(
		'/v1/users.autocomplete',
		useMemo(() => query(debouncedFilter), [debouncedFilter]),
	);

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name })) || [], [data]);

	const onClickRemove = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		onChange?.(e.currentTarget.value, 'remove');
	});
	const getAvatarETag = useCallback((user) => data && data.items.find(({ username }) => username === user)?.avatarETag, [data]);

	return (
		<AutoComplete
			{...props}
			onChange={onChange as any}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value: selected }): ReactElement =>
				selected?.map((value: any) => (
					<Chip key={value} {...props} height='x20' value={value} onClick={onClickRemove} mie='x4'>
						<UserAvatar size='x20' username={value} etag={getAvatarETag(value)} />
						<Box is='span' margin='none' mis='x4'>
							{value}
						</Box>
					</Chip>
				))
			}
			renderItem={({ value, label, ...props }) => (
				<Option key={value} {...props}>
					<Option.Avatar>
						<UserAvatar username={value} size='x20' etag={getAvatarETag(value)} />
					</Option.Avatar>
					<Option.Content>
						{label} <Option.Description>({value})</Option.Description>
					</Option.Content>
				</Option>
			)}
			options={options}
		/>
	);
};

export default memo(UserAutoCompleteMultiple);
