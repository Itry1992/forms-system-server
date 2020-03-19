export interface ThemeCustomInterface {
    title: {
        textAlign: string;
        fontSize: number;
        fontStyle: string;
        fontWeight: string;
        color: string;
    };
    background: { mode: 'color' | 'image'; color: string; image: string };
    banner: {
        mode: 'image' | 'color';
        image: string;
        color: string;
    };
    submit_btn: { backgroundColor: string };
}
