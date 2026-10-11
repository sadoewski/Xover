#!/usr/bin/env python3

project_path = "Xover.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

open_braces = content.count('{')
close_braces = content.count('}')
open_parens = content.count('(')
close_parens = content.count(')')

print(f"Open braces: {open_braces}")
print(f"Close braces: {close_braces}")
print(f"Balance: {open_braces - close_braces}")
print()
print(f"Open parens: {open_parens}")
print(f"Close parens: {close_parens}")
print(f"Balance: {open_parens - close_parens}")

if open_braces != close_braces:
    print("\n⚠️ Braces are unbalanced!")
if open_parens != close_parens:
    print("\n⚠️ Parentheses are unbalanced!")
    
if open_braces == close_braces and open_parens == close_parens:
    print("\n✅ All brackets are balanced")
