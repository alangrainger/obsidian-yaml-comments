import { DataWriteOptions, Plugin, TFile } from 'obsidian'

export default class YamlComments extends Plugin {
  originalProcessFrontMatter: {
    (file: TFile, fn: (frontmatter: any) => void, options?: DataWriteOptions | undefined): Promise<void>;
    (file: TFile, fn: (frontmatter: any) => void, options?: DataWriteOptions | undefined): Promise<void>;
    call?: any;
  }

  async onload () {
    // Store the original processMatterFunction reference
    this.originalProcessFrontMatter = this.app.fileManager.processFrontMatter

    // Replace it with our new custom function that does the same thing but also keeps the YAML comments
    this.app.fileManager.processFrontMatter = async (file, fn) => {
      // Get the original YAML
      const [originalYaml, bodyContent] = await this.getYamlAndBody(file)

      // Call Obsidian's built-in function to update the frontmatter correctly
      await this.originalProcessFrontMatter.call(this.app.fileManager, file, fn)

      // Get the updated frontmatter (which has had the comments stripped)
      const [newYaml, _] = await this.getYamlAndBody(file)

      // Inject the comments back into the new frontmatter YAML
      const newYamlWithComments = this.processComments(originalYaml, newYaml)
      const newContent = '---\n' + newYamlWithComments + '\n---\n' + bodyContent

      // Save the file back into the vault
      await this.app.vault.modify(file, newContent)
    }
  }

  async onunload () {
    // Restore the original function when plugin unloads
    if (this.originalProcessFrontMatter) {
      this.app.fileManager.processFrontMatter = this.originalProcessFrontMatter
    }
  }

  async getYamlAndBody (file: TFile) {
    const originalContent = await this.app.vault.read(file)
    const frontmatterMatch = originalContent.match(/^---\n(.*?)\n---\r?\n/s)
    const yaml = frontmatterMatch?.[1] || ''
    const body = originalContent.replace(/^---\n.*?\n---\r?\n/s, '')

    return [yaml, body]
  }

  processComments (originalYaml: string, newYaml: string) {
    let comment = ''

    // Loop through each line of the original YAML
    for (let line of originalYaml.split('\n')) {
      if (line.trim().startsWith('#')) {
        // This is a comment line. Store the comment
        comment += line + '\n'
      } else {
        // This is the non-comment line following the comment.
        // We now inject the comment back into this place
        // in the new YAML.

        // Get the key name
        const key = line.trim().match(/^(.+?(:|$))/)?.[1]
        if (key) {
          newYaml = this.injectCommentInCorrectPlace(comment, key, newYaml)
        }
        comment = ''
      }
    }

    // Any remaining comment goes at the end
    if (comment) newYaml += '\n' + comment.trimEnd()

    return newYaml
  }

  injectCommentInCorrectPlace (comment: string, key: string, yaml: string) {
    const lines = yaml.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith(key)) {
        lines[i] = comment + lines[i]
      }
    }
    return lines.join('\n')
  }
}
