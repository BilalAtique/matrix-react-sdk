/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { IPusher } from 'matrix-js-sdk/src/@types/PushRules';
import { PUSHER_ENABLED } from 'matrix-js-sdk/src/@types/event';

import DeviceDetails from '../../../../../src/components/views/settings/devices/DeviceDetails';

const mkPusher = (extra: Partial<IPusher> = {}): IPusher => ({
    app_display_name: "app",
    app_id: "123",
    data: {},
    device_display_name: "name",
    kind: "http",
    lang: "en",
    pushkey: "pushpush",
    ...extra,
});

describe('<DeviceDetails />', () => {
    const baseDevice = {
        device_id: 'my-device',
        isVerified: false,
    };
    const defaultProps = {
        device: baseDevice,
        pusher: null,
        isSigningOut: false,
        isLoading: false,
        onSignOutDevice: jest.fn(),
        saveDeviceName: jest.fn(),
        setPusherEnabled: jest.fn(),
        supportsMSC3881: true,
    };

    const getComponent = (props = {}) => <DeviceDetails {...defaultProps} {...props} />;

    // 14.03.2022 16:15
    const now = 1647270879403;
    jest.useFakeTimers();

    beforeEach(() => {
        jest.setSystemTime(now);
    });

    it('renders device without metadata', () => {
        const { container } = render(getComponent());
        expect(container).toMatchSnapshot();
    });

    it('renders device with metadata', () => {
        const device = {
            ...baseDevice,
            display_name: 'My Device',
            last_seen_ip: '123.456.789',
            last_seen_ts: now - 60000000,
        };
        const { container } = render(getComponent({ device }));
        expect(container).toMatchSnapshot();
    });

    it('renders a verified device', () => {
        const device = {
            ...baseDevice,
            isVerified: true,
        };
        const { container } = render(getComponent({ device }));
        expect(container).toMatchSnapshot();
    });

    it('disables sign out button while sign out is pending', () => {
        const device = {
            ...baseDevice,
        };
        const { getByTestId } = render(getComponent({ device, isSigningOut: true }));
        expect(
            getByTestId('device-detail-sign-out-cta').getAttribute('aria-disabled'),
        ).toEqual("true");
    });

    it('renders the push notification section when a pusher exists', () => {
        const device = {
            ...baseDevice,
        };
        const pusher = mkPusher({
            device_id: device.device_id,
        });

        const { getByTestId } = render(getComponent({
            device,
            pusher,
            isSigningOut: true,
        }));

        expect(getByTestId('device-detail-push-notification')).toBeTruthy();
    });

    it('hides the push notification section when no pusher', () => {
        const device = {
            ...baseDevice,
        };

        const { getByTestId } = render(getComponent({
            device,
            pusher: null,
            isSigningOut: true,
        }));

        expect(() => getByTestId('device-detail-push-notification')).toThrow();
    });

    it('disables the checkbox when there is no server support', () => {
        const device = {
            ...baseDevice,
        };
        const pusher = mkPusher({
            device_id: device.device_id,
            [PUSHER_ENABLED.name]: false,
        });

        const { getByTestId } = render(getComponent({
            device,
            pusher,
            isSigningOut: true,
            supportsMSC3881: false,
        }));

        const checkbox = getByTestId('device-detail-push-notification-checkbox');

        expect(checkbox.getAttribute('aria-disabled')).toEqual("true");
        expect(checkbox.getAttribute('aria-checked')).toEqual("false");
    });

    it('changes the pusher status when clicked', () => {
        const device = {
            ...baseDevice,
        };

        const enabled = false;

        const pusher = mkPusher({
            device_id: device.device_id,
            [PUSHER_ENABLED.name]: enabled,
        });

        const { getByTestId } = render(getComponent({
            device,
            pusher,
            isSigningOut: true,
        }));

        const checkbox = getByTestId('device-detail-push-notification-checkbox');

        fireEvent.click(checkbox);

        expect(defaultProps.setPusherEnabled).toHaveBeenCalledWith(!enabled);
    });
});
