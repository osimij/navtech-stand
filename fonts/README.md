# ALS Hauss Next — custom fonts

Two fixed TrueType fonts made from `ALS Hauss Next VF.ttf`.

| Font menu name | Use | Weight | Width axis | Built-in spacing |
| --- | --- | --- | --- | --- |
| ALS Hauss Next Titles | Larger titles | 550 | 450 | −0.015 em |
| ALS Hauss Next Body | Smaller text | 450 | 450 | −0.010 em |

Use **0 additional letter spacing** in your design tool or website; the tighter spacing is already built into these files. Both versions are upright, and the weight and width are fixed.

Spacing is baked in by shortening each advancing glyph by 15 units (Titles) or 10 units (Body) in this 1,000-units-per-em font. Zero-width combining marks are left unchanged. Original kerning, OpenType features, character coverage, and glyph outlines at the selected weight and width are preserved.

Font-level spacing follows rendered glyphs, including spaces, and also reduces the final glyph's advance. App-level tracking can differ for ligatures or line endings. Width 450 refers to this source font's own width-axis scale, not 450% stretching.

The font files have separate internal family names so both versions can be installed together. Original attribution is retained. The source font is unchanged.

Technical references: [fontTools static instancing](https://fonttools.readthedocs.io/en/latest/varLib/instancer.html) and [OpenType horizontal metrics](https://learn.microsoft.com/en-us/typography/opentype/spec/hmtx).
