import { LinkStyle } from '../../../models/link-style';

export class StyleTranslator {
    static getLinkStyle(linkStyle: LinkStyle) {
        if (linkStyle.type == 1) {
            return `10, 10`
        }
        if (linkStyle.type == 2) {
            return `${linkStyle.width}, ${linkStyle.width}`
        }
        if (linkStyle.type == 3) {
            return `20, 10, ${linkStyle.width}, ${linkStyle.width}, ${linkStyle.width}, 10`
        }
        return `0, 0`
    }
}
