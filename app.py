from flask import Flask, render_template, request, redirect, url_for, flash
import pandas as pd
import os

app = Flask(__name__)
app.secret_key = 'secret_key'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

grammar_data = None
parsed_results = {}

def load_grammar(filepath):
    df = pd.read_excel(filepath)
    return df.to_dict(orient='records')

class GrammarParser:
    def __init__(self, grammar_file):
        global grammar_data
        self.grammar = grammar_data if grammar_data else load_grammar(grammar_file)
        self.input_stack = []
        self.stack = []
        self.output_stack = []
        self.output_steps = []
        self.derivation_tree = ""
        self.accepted = True

    def parse_input(self, input_file):
        with open(input_file, 'r', encoding='utf-8') as f:
            self.input_stack = f.read().strip().split()

        self.stack = []
        self.output_stack = []
        self.output_steps = []
        self.process()
        self.derivation_tree = self.generate_derivation_tree()

        return {
            "input_stack": self.input_stack,
            "stack": self.stack,
            "output_stack": self.output_stack,
            "steps": self.output_steps,
            "derivation_tree": self.derivation_tree,
            "accepted": self.accepted
        }

    def process(self):
        for token in self.input_stack:
            self.stack.append(token)
            matching_rule = self.find_production_rule(token)
            
            if matching_rule:
                self.output_stack.append(matching_rule)
                self.output_steps.append(f"<strong>{token}</strong> → {matching_rule}")
            else:
                self.output_steps.append(f"<span style='color:red'><strong>{token}</strong> no está en la gramática.</span>")
                self.accepted = False
        
        summary_color = "green" if self.accepted else "red"
        summary_text = "Entrada ACEPTADA ✅" if self.accepted else "Entrada RECHAZADA ❌"
        self.output_steps.append(f"<p style='color:{summary_color}; font-weight: bold;'>{summary_text}</p>")

    def find_production_rule(self, token):
        for rule in self.grammar:
            if token in rule.values():
                return f"{rule}"
        return None

    def generate_derivation_tree(self):
        tokens = self.input_stack
        tree = "Árbol de derivación:\n"

        if not tokens:
            return "No hay entrada para generar el árbol."

        tree += "S\n"
        level = "  "

        for token in tokens:
            tree += f"{level}└── {token}\n"
            level += "  "

        return tree

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload_grammar', methods=['POST'])
def upload_grammar():
    global grammar_data
    file = request.files['grammar_file']
    if file and file.filename.endswith('.xlsx'):
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        grammar_data = load_grammar(filepath)
        flash("Gramática cargada correctamente.", "success")
        return redirect(url_for('index'))
    flash("Error al cargar la gramática.", "danger")
    return redirect(url_for('index'))

@app.route('/upload_input', methods=['POST'])
def upload_input():
    global parsed_results
    file = request.files['input_file']
    if file and file.filename.endswith('.txt') and grammar_data:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        parser = GrammarParser(None)
        parsed_results = parser.parse_input(filepath)
        os.remove(filepath)
        flash("Entrada cargada correctamente.", "success")
        return redirect(url_for('view_output'))
    flash("Error al cargar la entrada.", "danger")
    return redirect(url_for('index'))

@app.route('/view_output')
def view_output():
    global parsed_results
    if not parsed_results:
        flash("No se generaron resultados.", "danger")
        return redirect(url_for('index'))
    return render_template('output.html', result=parsed_results)

if __name__ == '__main__':
    app.run(debug=True)