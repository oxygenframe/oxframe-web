from manim import *


class Hello(Scene):
    def construct(self):
        circle = Circle(radius=1.5, color=RED)
        self.play(Create(circle))
        self.play(Transform(circle, Square(side_length=3, color=BLUE)))
        self.play(circle.animate.shift(RIGHT * 2))
        self.wait()


class Graph(Scene):
    def construct(self):
        axes = Axes(x_range=[-3, 3], y_range=[-1.5, 1.5])
        sine = axes.plot(lambda x: np.sin(x), color=BLUE)
        self.add(axes)
        self.play(Create(sine))
        x = ValueTracker(-3)
        dot = always_redraw(lambda: Dot(axes.i2gp(x.get_value(), sine)))
        self.add(dot)
        self.play(x.animate.set_value(3), run_time=2)
        self.wait(0.5)
