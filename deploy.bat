cd dist

git init
git add -A
git commit -m "deploy"

git push -f --progress "https://github.com/bolanxian/movable-type-voice.git" master:gh-pages