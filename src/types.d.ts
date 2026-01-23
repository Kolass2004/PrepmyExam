declare module 'react-file-icon' {
    import { ComponentType, HTMLAttributes } from 'react';

    export interface FileIconProps extends HTMLAttributes<HTMLElement> {
        extension?: string;
        fold?: boolean;
        pageVignette?: boolean;
        color?: string;
        labelColor?: string;
        labelTextColor?: string;
        labelTextStyle?: object;
        type?: string;
        glyphColor?: string;
        radius?: number;
    }

    export const FileIcon: ComponentType<FileIconProps>;

    export const defaultStyles: {
        [key: string]: FileIconProps;
    };
}
