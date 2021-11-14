const gulp = require("gulp")
const ts = require("gulp-typescript")

const paths = {
    resource: ["src/resource/**/*"],
}

const tsProject = ts.createProject("tsconfig.json")

gulp.task("copy-resource-file", function () {
    return gulp.src(paths.resource).pipe(gulp.dest("dist/resource"))
});

gulp.task("compile-ts", function () {
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"))
})

gulp.task("default", gulp.series(gulp.parallel("copy-resource-file","compile-ts")))